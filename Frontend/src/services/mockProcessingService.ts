/**
 * Mock Processing Service for BhoomiVerify AI
 *
 * Isolated mock pipeline simulation for development and prototype demonstration.
 * This can be swapped with real WebSocket / Server-Sent Events / polling endpoints
 * without touching the UI presentation components.
 */

import type {
  PipelineStage,
  DocumentQualityScan,
  ProcessingActivity,
  ProcessingState,
} from '@/types';

export const INITIAL_PIPELINE_STAGES: PipelineStage[] = [
  { id: 1, name: 'Document Received', description: 'Upload completed and document registered in system', status: 'waiting' },
  { id: 2, name: 'File Integrity Check', description: 'SHA-256 verification and file structure validation', status: 'waiting' },
  { id: 3, name: 'Document Quality Analysis', description: 'Assessing DPI, blur, contrast, and page condition', status: 'waiting' },
  { id: 4, name: 'Image Enhancement', description: 'Binarization, deskewing, and contrast normalization', status: 'waiting' },
  { id: 5, name: 'Language & Layout Detection', description: 'Detecting script (Devanagari, English, etc.) & layout blocks', status: 'waiting' },
  { id: 6, name: 'OCR / Handwriting Recognition', description: 'Hybrid CRNN + TrOCR text & numeral recognition', status: 'waiting' },
  { id: 7, name: 'Land Field Extraction', description: 'Extracting Khasra, Khata, Owner names, and Area', status: 'waiting' },
  { id: 8, name: 'Confidence Analysis', description: 'Field-level confidence scoring & verification checks', status: 'waiting' },
  { id: 9, name: 'Preparing Analysis Result', description: 'Compiling structured record and audit package', status: 'waiting' },
];

export const MOCK_QUALITY_SCAN: DocumentQualityScan = {
  resolution: { label: 'Resolution', value: '300 DPI', status: 'good', statusLabel: 'Good' },
  orientation: { label: 'Orientation', value: 'Corrected', status: 'good', statusLabel: 'Fixed' },
  blur: { label: 'Blur', value: 'Acceptable', status: 'good', statusLabel: 'Good' },
  contrast: { label: 'Contrast', value: 'Low', status: 'warning', statusLabel: 'Needs Enhancement' },
  pageDamage: { label: 'Page Damage', value: 'Detected', status: 'warning', statusLabel: 'Review' },
  brightness: { label: 'Brightness', value: 'Normal', status: 'good', statusLabel: 'Good' },
  score: 72,
  statusText: 'Fair — AI enhancement recommended',
};

export const MOCK_AI_INSIGHT =
  'Low contrast detected on 2 pages. Adaptive enhancement is being applied before text recognition.';

interface SimulationStep {
  stageId: number;
  progress: number;
  message: string;
  activityText?: string;
  delayMs: number;
}

const SIMULATION_STEPS: SimulationStep[] = [
  { stageId: 1, progress: 0, message: 'Receiving document...', activityText: 'Document received and registered', delayMs: 400 },
  { stageId: 2, progress: 12, message: 'Checking file integrity...', activityText: 'File integrity verified (SHA-256 validated)', delayMs: 700 },
  { stageId: 3, progress: 24, message: 'Analyzing document quality...', activityText: 'Document quality analysis started', delayMs: 900 },
  { stageId: 4, progress: 38, message: 'Enhancing document image...', activityText: 'Low contrast detected — Adaptive enhancement started', delayMs: 1100 },
  { stageId: 5, progress: 51, message: 'Detecting language and layout...', activityText: 'Language identified: Hindi / English bilingual layout', delayMs: 1000 },
  { stageId: 6, progress: 64, message: 'Running OCR / handwriting recognition...', activityText: 'Hybrid OCR & handwriting recognition active', delayMs: 1300 },
  { stageId: 7, progress: 78, message: 'Extracting land record fields...', activityText: 'Identified Khasra No., Khatauni, Owner names, and Area', delayMs: 1100 },
  { stageId: 8, progress: 91, message: 'Calculating confidence scores...', activityText: 'Confidence evaluation completed (Overall: 88%)', delayMs: 800 },
  { stageId: 9, progress: 100, message: 'Preparing analysis result...', activityText: 'Analysis compiled and ready for review', delayMs: 700 },
];

function formatTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Creates initial processing state for a given documentId
 */
export function getInitialProcessingState(documentId: string, fileName?: string): ProcessingState {
  const now = new Date();
  return {
    documentId,
    fileName: fileName || 'Uploaded-Document.pdf',
    status: 'processing',
    currentStageId: 1,
    progress: 0,
    message: 'Receiving document...',
    stages: INITIAL_PIPELINE_STAGES.map((s) =>
      s.id === 1 ? { ...s, status: 'processing' } : { ...s, status: 'waiting' }
    ),
    qualityScan: MOCK_QUALITY_SCAN,
    aiInsight: MOCK_AI_INSIGHT,
    activities: [
      {
        id: 'act-0',
        time: formatTime(now),
        message: 'Document received',
        stageId: 1,
      },
    ],
  };
}

/**
 * Simulates end-to-end processing pipeline with callbacks.
 * Returns a cancel/cleanup function.
 */
export function startMockProcessing(
  documentId: string,
  fileName: string,
  onUpdate: (state: ProcessingState) => void,
  onComplete: (documentId: string) => void
): () => void {
  let isCancelled = false;
  let currentTimeout: ReturnType<typeof setTimeout> | null = null;
  const startTime = new Date();

  // Helper to add seconds for realistic activity log display
  let secondsOffset = 0;

  const runStep = (stepIndex: number) => {
    if (isCancelled) return;

    if (stepIndex >= SIMULATION_STEPS.length) {
      // Completed
      const completedStages: PipelineStage[] = INITIAL_PIPELINE_STAGES.map((s) => ({
        ...s,
        status: 'completed',
      }));

      onUpdate({
        documentId,
        fileName,
        status: 'completed',
        currentStageId: 9,
        progress: 100,
        message: 'ANALYSIS COMPLETE',
        stages: completedStages,
        qualityScan: MOCK_QUALITY_SCAN,
        aiInsight: MOCK_AI_INSIGHT,
        activities: [
          ...SIMULATION_STEPS.map((s, idx) => {
            const time = new Date(startTime.getTime() + idx * 1200);
            return {
              id: `act-${s.stageId}`,
              time: formatTime(time),
              message: s.activityText || s.message,
              stageId: s.stageId,
            };
          }),
        ],
      });

      onComplete(documentId);
      return;
    }

    const step = SIMULATION_STEPS[stepIndex];
    secondsOffset += 1;
    const stepTime = new Date(startTime.getTime() + secondsOffset * 1000);

    const updatedStages: PipelineStage[] = INITIAL_PIPELINE_STAGES.map((s) => {
      if (s.id < step.stageId) return { ...s, status: 'completed' };
      if (s.id === step.stageId) return { ...s, status: 'processing' };
      return { ...s, status: 'waiting' };
    });

    const currentActivities: ProcessingActivity[] = SIMULATION_STEPS.slice(0, stepIndex + 1).map(
      (s, idx) => {
        const t = new Date(startTime.getTime() + (idx + 1) * 1000);
        return {
          id: `act-${s.stageId}`,
          time: formatTime(t),
          message: s.activityText || s.message,
          stageId: s.stageId,
        };
      }
    );

    onUpdate({
      documentId,
      fileName,
      status: 'processing',
      currentStageId: step.stageId,
      progress: step.progress,
      message: step.message,
      stages: updatedStages,
      qualityScan: MOCK_QUALITY_SCAN,
      aiInsight: MOCK_AI_INSIGHT,
      activities: currentActivities,
    });

    currentTimeout = setTimeout(() => {
      runStep(stepIndex + 1);
    }, step.delayMs);
  };

  // Kick off first step
  currentTimeout = setTimeout(() => {
    runStep(0);
  }, 300);

  return () => {
    isCancelled = true;
    if (currentTimeout) clearTimeout(currentTimeout);
  };
}
