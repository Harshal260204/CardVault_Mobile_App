/** Structured fields returned to clients (API contract — uses `title`, not jobTitle). */
export interface ExtractedFieldSet {
  fullName: string;
  company: string;
  title: string;
  emails: string[];
  phones: string[];
  website: string;
}

export interface OcrProviderExtraction {
  rawText: string;
  averageVisionConfidence?: number;
  visionBlockCount?: number;
  visionPageCount?: number;
  processingMs?: number;
}

export interface ExtractionResult {
  fields: ExtractedFieldSet;
  confidenceScores: Record<string, number>;
  meanConfidence: number;
  rawText: string;
  provider: string;
  processingTimeMs: number;
  /** Set when OCR provider failed but job continues as manual_fallback */
  providerError?: string;
  /** Optional Vision metadata (logged; not sent to mobile clients) */
  providerMetadata?: Pick<
    OcrProviderExtraction,
    'averageVisionConfidence' | 'visionBlockCount' | 'visionPageCount'
  >;
}

/** Parser output (internal — may include address for future use). */
export interface ParsedContactFields {
  fullName?: string;
  company?: string;
  jobTitle?: string;
  emails?: string[];
  phones?: string[];
  website?: string;
  address?: string;
}

export interface OcrTextProvider {
  readonly name: string;
  extractText(buffer: Buffer, fileName?: string): Promise<string>;
}
