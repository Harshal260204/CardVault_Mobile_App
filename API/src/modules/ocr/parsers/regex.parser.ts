import { Injectable } from '@nestjs/common';
import type { ParsedContactFields } from '../ocr.types';
import { cleanOcrText, linesFromOcrText } from '../utils/cleanup';
import {
  normalizeWebsite,
  sanitizeEmail,
  sanitizePhone,
} from '../utils/field-sanitize';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const PHONE_REGEX =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}(?:[\s.-]?\d{1,5})?/g;

const WEBSITE_REGEX =
  /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z]{2,})+(?:\/[^\s]*)?/gi;

const TITLE_KEYWORDS =
  /\b(director|manager|engineer|developer|consultant|analyst|president|founder|ceo|cto|cfo|cio|vp|vice president|head of|lead|specialist|coordinator|officer|partner|architect|designer)\b/i;

const COMPANY_SUFFIX =
  /\b(inc\.?|llc|ltd\.?|corp\.?|corporation|company|co\.?|gmbh|plc|group|holdings|solutions|technologies|tech)\b/i;

const ADDRESS_HINT =
  /\d+\s+\w+|\b(street|st\.?|road|rd\.?|avenue|ave\.?|suite|ste\.?|floor|blvd|boulevard|drive|dr\.?)\b/i;

/** Marketing taglines often mistaken for company names */
const SLOGAN_HINT =
  /\b(your|our)\s+(expectation|innovation|vision|mission|commitment)\b/i;

const PRODUCT_LINE_HINT =
  /\b(headset|surveillance|conferencing|audio\/\s*video|ip\s*pbx|telecom\/it)\b/i;

@Injectable()
export class RegexContactParser {
  /**
   * Parse raw OCR text into structured contact fields.
   * Designed to be swapped or augmented with LLM parsing later.
   */
  parse(rawText: string): ParsedContactFields {
    const cleaned = cleanOcrText(rawText);
    if (!cleaned) {
      return {};
    }

    const emails = this.unique(
      [...cleaned.matchAll(EMAIL_REGEX)]
        .map((m) => sanitizeEmail(m[0]))
        .filter(Boolean),
    );
    const phones = this.normalizePhones(
      [...cleaned.matchAll(PHONE_REGEX)].map((m) => m[0]),
    );
    const websites = this.normalizeWebsites(
      [...cleaned.matchAll(WEBSITE_REGEX)].map((m) => m[0]),
      emails,
    );

    let lines = linesFromOcrText(cleaned);
    lines = lines.filter((line) => {
      if (/@/.test(line) && /\.[a-z]{2,}/i.test(line)) return false;
      if (this.lineIsMostlyPhone(line)) return false;
      if (/^https?:\/\//i.test(line) || /^www\./i.test(line)) return false;
      return true;
    });

    const { fullName, jobTitle, company, address } = this.inferFromLines(lines);

    return {
      fullName: fullName || undefined,
      company: company || undefined,
      jobTitle: jobTitle || undefined,
      emails: emails.length ? emails : undefined,
      phones: phones.length ? phones : undefined,
      website: websites[0],
      address: address || undefined,
    };
  }

  private unique(values: string[]): string[] {
    return [...new Set(values)];
  }

  private normalizePhones(raw: string[]): string[] {
    const out: string[] = [];
    for (const p of raw) {
      const digits = p.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) continue;
      const formatted = sanitizePhone(p);
      if (!out.includes(formatted)) out.push(formatted);
    }
    return out;
  }

  private normalizeWebsites(raw: string[], emails: string[] = []): string[] {
    const out: string[] = [];
    for (const w of raw) {
      const normalized = normalizeWebsite(w);
      if (!normalized || out.includes(normalized)) continue;
      const host = normalized
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .split('/')[0]
        .toLowerCase();
      const looksLikeEmailLocal = emails.some((e) => {
        const local = e.split('@')[0]?.toLowerCase();
        return local && (host === local || host.startsWith(`${local}.`));
      });
      if (looksLikeEmailLocal) continue;
      out.push(normalized);
    }
    return out;
  }

  private scoreCompanyLine(line: string): number {
    if (PRODUCT_LINE_HINT.test(line) || (/\|/.test(line) && line.length > 30)) {
      return -10;
    }
    let score = 0;
    if (COMPANY_SUFFIX.test(line)) score += 4;
    if (/\b(telecom|network|systems|solutions|technologies)\b/i.test(line))
      score += 2;
    if (SLOGAN_HINT.test(line)) score -= 4;
    if (line.length > 72) score -= 3;
    if (/^[A-Z0-9]{2,6}$/.test(line.trim())) score -= 3;
    if (/^Your\s+/i.test(line) && /Our\s+/i.test(line)) score -= 2;
    return score;
  }

  private pickBestCompanyLine(
    lines: string[],
    fullName?: string,
    jobTitle?: string,
  ): string | undefined {
    let best: { line: string; score: number } | undefined;

    for (const line of lines) {
      if (line === fullName || line === jobTitle) continue;
      if (/@/.test(line) || this.lineIsMostlyPhone(line)) continue;
      if (TITLE_KEYWORDS.test(line) && line.length < 80) continue;
      if (ADDRESS_HINT.test(line)) continue;

      const score = this.scoreCompanyLine(line);
      if (!best || score > best.score) {
        best = { line, score };
      }
    }

    return best && best.score >= 2 ? best.line : undefined;
  }

  private lineIsMostlyPhone(line: string): boolean {
    const digits = line.replace(/\D/g, '');
    return (
      digits.length >= 7 && digits.length / line.replace(/\s/g, '').length > 0.6
    );
  }

  private inferFromLines(lines: string[]): {
    fullName?: string;
    jobTitle?: string;
    company?: string;
    address?: string;
  } {
    let fullName: string | undefined;
    let jobTitle: string | undefined;
    let company: string | undefined;
    let address: string | undefined;

    const remaining: string[] = [];

    for (const line of lines) {
      if (
        PRODUCT_LINE_HINT.test(line) ||
        (/\|/.test(line) && line.length > 40)
      ) {
        continue;
      }
      if (!jobTitle && TITLE_KEYWORDS.test(line) && line.length < 90) {
        jobTitle = line;
        continue;
      }
      if (!fullName && this.looksLikeName(line)) {
        fullName = line;
        continue;
      }
      if (!address && ADDRESS_HINT.test(line)) {
        address = line;
        continue;
      }
      remaining.push(line);
    }

    if (!fullName && remaining.length) {
      const candidate = remaining.shift();
      if (candidate && this.looksLikeName(candidate)) {
        fullName = candidate;
      } else if (candidate) {
        remaining.unshift(candidate);
      }
    }

    if (!company) {
      company = this.pickBestCompanyLine(lines, fullName, jobTitle);
    }

    if (!jobTitle && remaining.length) {
      const titleLine = remaining.find((l) => TITLE_KEYWORDS.test(l));
      if (titleLine) jobTitle = titleLine;
    }

    if (jobTitle && remaining.length) {
      const region = remaining.find(
        (l) =>
          /\bregion\b/i.test(l) && l.length < 40 && !TITLE_KEYWORDS.test(l),
      );
      if (region && !jobTitle.toLowerCase().includes(region.toLowerCase())) {
        jobTitle = `${jobTitle} - ${region}`;
      }
    }

    if (fullName && TITLE_KEYWORDS.test(fullName)) {
      const nameLine = lines.find(
        (l) => this.looksLikeName(l) && !TITLE_KEYWORDS.test(l),
      );
      if (nameLine) {
        jobTitle = jobTitle || fullName;
        fullName = nameLine;
      } else {
        jobTitle = fullName;
        fullName = undefined;
        const fallbackName = lines.find((l) => this.looksLikeName(l));
        if (fallbackName) fullName = fallbackName;
      }
    }

    return { fullName, jobTitle, company, address };
  }

  private looksLikeName(line: string): boolean {
    if (line.length < 3 || line.length > 60) return false;
    if (TITLE_KEYWORDS.test(line)) return false;
    if (PRODUCT_LINE_HINT.test(line)) return false;
    if (/\d/.test(line)) return false;
    if (/@/.test(line)) return false;
    if (/^https?:\/\//i.test(line) || /^www\./i.test(line)) return false;
    if (/\|/.test(line)) return false;
    const words = line.split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 5) return false;
    return words.every((w) => /^[A-Za-z][A-Za-z'.-]*$/.test(w));
  }
}
