/**
 * Standalone OCR smoke test (provider selected via OCR_PROVIDER).
 *
 * Usage (from API/):
 *   npm run test:ocr -- path/to/business-card.jpg
 *
 * Google Vision (default):
 *   OCR_PROVIDER=google
 *   GOOGLE_VISION_KEY_PATH=./credentials/google-vision.json
 *
 * Legacy Paddle (requires ocr_service running):
 *   OCR_PROVIDER=paddle
 *   PADDLE_OCR_URL=http://127.0.0.1:8001
 */
import 'dotenv/config';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { GoogleVisionProvider } from '../src/modules/ocr/providers/google-vision.provider';
import { PaddleOcrProvider } from '../src/modules/ocr/providers/paddle-ocr.provider';
import { RegexContactParser } from '../src/modules/ocr/parsers/regex.parser';
import {
  buildConfidenceScores,
  meanConfidence,
} from '../src/modules/ocr/utils/confidence';
import type {
  ExtractedFieldSet,
  ParsedContactFields,
} from '../src/modules/ocr/ocr.types';

function toFields(parsed: ParsedContactFields): ExtractedFieldSet {
  return {
    fullName: parsed.fullName ?? '',
    company: parsed.company ?? '',
    title: parsed.jobTitle ?? '',
    emails: parsed.emails ?? [],
    phones: parsed.phones ?? [],
    website: parsed.website ?? '',
  };
}

async function main(): Promise<void> {
  const imagePath = process.argv[2];
  if (!imagePath) {
    console.error('Usage: npm run test:ocr -- <path-to-image>');
    process.exit(1);
  }

  const providerName = process.env.OCR_PROVIDER?.trim().toLowerCase() || 'google';
  const abs = resolve(process.cwd(), imagePath);
  const buffer = await readFile(abs);
  const name = abs.split(/[/\\]/).pop() ?? 'card.jpg';

  console.log(`--- CardVault OCR test (${providerName}) ---`);
  console.log('Image:', abs, `(${buffer.length} bytes)`);
  console.log('OCR_PROVIDER:', providerName);

  const parser = new RegexContactParser();
  const started = Date.now();
  let rawText = '';

  if (providerName === 'paddle') {
    const paddle = new PaddleOcrProvider();
    await paddle.onModuleInit();
    rawText = await paddle.extractText(buffer, name);
  } else {
    const vision = new GoogleVisionProvider();
    await vision.onModuleInit();
    const extraction = await vision.extractWithMetadata(buffer, name);
    rawText = extraction.rawText;
    console.log('\n--- Vision metadata ---');
    console.log(
      JSON.stringify(
        {
          visionBlockCount: extraction.visionBlockCount ?? 0,
          visionPageCount: extraction.visionPageCount ?? 0,
          averageVisionConfidence: extraction.averageVisionConfidence ?? null,
          processingMs: extraction.processingMs ?? null,
        },
        null,
        2,
      ),
    );
  }

  const ocrMs = Date.now() - started;

  console.log('\n--- Raw OCR text ---');
  console.log(rawText || '(empty)');

  const parseStarted = Date.now();
  const parsed = parser.parse(rawText);
  const parseMs = Date.now() - parseStarted;
  const fields = toFields(parsed);
  const scores = buildConfidenceScores(parsed, fields);

  console.log('\n--- Parsed fields ---');
  console.log(JSON.stringify(fields, null, 2));
  console.log('\n--- Confidence ---');
  console.log(JSON.stringify(scores, null, 2));
  console.log('Mean confidence:', meanConfidence(scores).toFixed(3));
  console.log(
    `\nTiming: OCR ${ocrMs}ms, parse ${parseMs}ms, total ${Date.now() - started}ms`,
  );
}

main().catch((err) => {
  console.error('OCR test failed:', err);
  process.exit(1);
});
