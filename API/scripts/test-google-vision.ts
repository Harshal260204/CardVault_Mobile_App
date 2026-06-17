/**
 * Standalone Google Cloud Vision OCR smoke test.
 *
 * Usage (from API/):
 *   npm run test:google-ocr -- path/to/business-card.jpg
 *
 * Requires:
 *   OCR_PROVIDER=google (default)
 *   GOOGLE_VISION_KEY_PATH=./src/secure/cardvault-ocr-4a8c0f17725e.json
 */
import 'dotenv/config';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { GoogleVisionProvider } from '../src/modules/ocr/providers/google-vision.provider';
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
    console.error('Usage: npm run test:google-ocr -- <path-to-image>');
    process.exit(1);
  }

  const abs = resolve(process.cwd(), imagePath);
  const buffer = await readFile(abs);
  const name = abs.split(/[/\\]/).pop() ?? 'card.jpg';

  console.log('--- CardVault Google Vision OCR test ---');
  console.log('Image:', abs, `(${buffer.length} bytes)`);
  console.log(
    'GOOGLE_VISION_KEY_PATH:',
    process.env.GOOGLE_VISION_KEY_PATH ?? '(not set)',
  );

  const vision = new GoogleVisionProvider();
  await vision.onModuleInit();

  const parser = new RegexContactParser();
  const started = Date.now();
  const extraction = await vision.extractWithMetadata(buffer, name);
  const ocrMs = Date.now() - started;

  console.log('\n--- Detected text ---');
  console.log(extraction.rawText || '(empty)');

  console.log('\n--- Vision metadata ---');
  console.log(
    JSON.stringify(
      {
        visionBlockCount: extraction.visionBlockCount ?? 0,
        visionPageCount: extraction.visionPageCount ?? 0,
        averageVisionConfidence: extraction.averageVisionConfidence ?? null,
        processingMs: extraction.processingMs ?? ocrMs,
      },
      null,
      2,
    ),
  );

  const parseStarted = Date.now();
  const parsed = parser.parse(extraction.rawText);
  const parseMs = Date.now() - parseStarted;
  const fields = toFields(parsed);
  const scores = buildConfidenceScores(parsed, fields);

  console.log('\n--- Parsed fields ---');
  console.log(JSON.stringify(fields, null, 2));
  console.log('\n--- Confidence ---');
  console.log(JSON.stringify(scores, null, 2));
  console.log('Mean confidence:', meanConfidence(scores).toFixed(3));
  console.log(
    `\nTiming: Vision ${ocrMs}ms, parse ${parseMs}ms, total ${Date.now() - started}ms`,
  );
}

main().catch((err) => {
  console.error('Google Vision OCR test failed:', err);
  process.exit(1);
});
