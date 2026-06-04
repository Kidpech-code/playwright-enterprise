import { Page } from '@playwright/test';
import { ManualStep } from '../manual/types';

export type TutorialMode = 'autoplay' | 'step';

export interface TutorialTiming {
  stepDelayMs: number;
  captureDelayMs: number;
}

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  captureLabel?: string;
  action: (context: TutorialActionContext) => Promise<void>;
}

export interface TutorialActionContext {
  page: Page;
}

export interface TutorialRuntimeLike {
  controlledDelay(milliseconds: number): Promise<void>;
  isStopRequested(): boolean;
  recordEvidence(
    kind: 'checkpoint' | 'note' | 'bug',
    payload: {
      label: string;
      note?: string;
      category?: string;
      severity?: string;
    },
  ): Promise<ManualStep | undefined>;
  setControllerState(
    state: 'recording' | 'capturing' | 'paused' | 'error',
    payload?: Record<string, unknown>,
  ): Promise<void>;
  waitWhilePaused(): Promise<void>;
}

export interface TutorialOverlayLike {
  show(step: Pick<TutorialStep, 'title' | 'description' | 'targetSelector'>): Promise<void>;
  hide(): Promise<void>;
}

export interface GuidedTutorialOptions {
  mode: TutorialMode;
  timing: TutorialTiming;
  pauseOnFailure: boolean;
}
