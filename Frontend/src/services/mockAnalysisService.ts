/**
 * Mock Analysis Service for BhoomiVerify AI (Screen 3)
 *
 * Provides prototype extraction data conforming to the future backend API contract:
 * GET /documents/{documentId}/analysis
 *
 * NOTE: All data is labeled as prototype/mock extraction.
 * No claims of ground truth or verified legal ownership are made at this stage.
 */

import type { DocumentAnalysisResult, ExtractedField } from '@/types';

export function getMockAnalysisResult(
  documentId: string,
  fileName?: string
): DocumentAnalysisResult {
  const currentFileName = fileName || 'Chatgpt-solution-v1.pdf';
  const now = new Date();
  const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  const fields: ExtractedField[] = [
    {
      id: 'field-owner-name',
      category: 'owner',
      categoryLabel: 'Owner Details',
      name: 'Owner Name',
      value: 'Ram Singh',
      confidence: 98,
      confidenceLevel: 'high',
      sourcePage: 1,
      sourceRegion: 'Page 1 • Header Block 2',
      boundingSnippetText: 'खातेदार / भू-स्वामी का नाम: श्री राम सिंह (आत्मज: श्री बलवंत सिंह)',
      needsAttention: false,
    },
    {
      id: 'field-survey-khasra',
      category: 'identification',
      categoryLabel: 'Land Identification',
      name: 'Khasra Number',
      value: '127/2',
      confidence: 96,
      confidenceLevel: 'high',
      sourcePage: 2,
      sourceRegion: 'Page 2 • Table Column 1',
      boundingSnippetText: 'खसरा क्रमांक: 127/2 (पुस्तैनी अभिलेख)',
      needsAttention: false,
    },
    {
      id: 'field-khata',
      category: 'identification',
      categoryLabel: 'Land Identification',
      name: 'Khata Number',
      value: '45',
      confidence: 99,
      confidenceLevel: 'high',
      sourcePage: 2,
      sourceRegion: 'Page 2 • Table Column 2',
      boundingSnippetText: 'खाता / खतौनी संख्या: 45 / चालू वर्ष',
      needsAttention: false,
    },
    {
      id: 'field-plot-area',
      category: 'details',
      categoryLabel: 'Land Details',
      name: 'Plot Area',
      value: '2.50 Acre',
      confidence: 61,
      confidenceLevel: 'low',
      sourcePage: 2,
      sourceRegion: 'Page 2 • Region 4 (Handwritten annotation)',
      boundingSnippetText: 'कुल रकबा (क्षेत्रफल): २.५० एकड़ [स्याही आंशिक धुंधली]',
      needsAttention: true,
    },
    {
      id: 'field-land-class',
      category: 'details',
      categoryLabel: 'Land Details',
      name: 'Land Classification',
      value: 'Agricultural',
      confidence: 68,
      confidenceLevel: 'low',
      sourcePage: 3,
      sourceRegion: 'Page 3 • Clause 4b',
      boundingSnippetText: 'भूमि प्रकार / श्रेणी: कृषि (एक फसली / सिंचित विवरण अस्पष्ट)',
      needsAttention: true,
    },
    {
      id: 'field-village',
      category: 'location',
      categoryLabel: 'Location',
      name: 'Village',
      value: 'Rampur',
      confidence: 98,
      confidenceLevel: 'high',
      sourcePage: 1,
      sourceRegion: 'Page 1 • Location Header',
      boundingSnippetText: 'ग्राम / मौजा: रामपुर (हल्का नंबर: 14)',
      needsAttention: false,
    },
    {
      id: 'field-tehsil',
      category: 'location',
      categoryLabel: 'Location',
      name: 'Tehsil',
      value: 'XYZ',
      confidence: 97,
      confidenceLevel: 'high',
      sourcePage: 1,
      sourceRegion: 'Page 1 • Location Header',
      boundingSnippetText: 'तहसील: XYZ',
      needsAttention: false,
    },
    {
      id: 'field-district',
      category: 'location',
      categoryLabel: 'Location',
      name: 'District',
      value: 'Jabalpur',
      confidence: 99,
      confidenceLevel: 'high',
      sourcePage: 1,
      sourceRegion: 'Page 1 • Location Header',
      boundingSnippetText: 'जिला: जबलपुर (मध्य प्रदेश)',
      needsAttention: false,
    },
  ];

  return {
    documentId,
    fileName: currentFileName,
    status: 'completed',
    pages: 4,
    processingMode: 'Automatic',
    timestamp: `${formattedDate} at ${formattedTime}`,

    quality: {
      score: 72,
      statusText: 'Fair',
      resolution: { value: '300 DPI', status: 'good', label: 'Good' },
      orientation: { value: 'Corrected', status: 'good', label: 'Fixed' },
      blur: { value: 'Acceptable', status: 'good', label: 'Good' },
      contrast: { value: 'Low', status: 'warning', label: 'Enhanced' },
      pageDamage: { value: 'Detected', status: 'warning', label: 'Review' },
      brightness: { value: 'Normal', status: 'good', label: 'Good' },
      note: 'AI enhancement was applied to improve document readability before extraction.',
    },

    understanding: {
      language: 'Hindi + English',
      script: 'Devanagari + Latin',
      documentType: 'Land Revenue Record',
      recognitionMode: 'Mixed — Printed + Handwritten',
      pages: 4,
      layout: 'Structured Record / Tabular',
      confidence: 94,
    },

    metrics: {
      qualityScore: 72,
      qualityStatus: 'Fair',
      extractionConfidence: 91,
      confidenceStatus: 'High',
      fieldsExtracted: 8,
      totalFields: 8,
      fieldsStatus: 'Complete',
      fieldsNeedingAttention: 2,
      attentionStatus: 'Review Recommended',
    },

    fields,

    aiSummary:
      '8 land-record fields were identified from the document. Most fields have high extraction confidence. 2 fields have lower confidence and may require review.',

    lowConfidenceWarning: {
      count: 2,
      message:
        'These fields were extracted with lower confidence and should be reviewed during validation.',
      fields: [
        { name: 'Plot Area', confidence: 61 },
        { name: 'Land Classification', confidence: 68 },
      ],
    },

    provenance: {
      documentId,
      source: 'Original uploaded document',
      pagesAnalyzed: 4,
      extractionEngine: 'AI Document Intelligence',
      processingState: 'Completed',
      timestamp: `${formattedDate}, ${formattedTime}`,
    },
  };
}
