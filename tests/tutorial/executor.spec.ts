import { test, expect } from '@playwright/test';
import { TutorialStepExecutor } from '../../src/tutorial/executor';
import { TutorialOverlayLike, TutorialRuntimeLike } from '../../src/tutorial/types';
import { ManualStep } from '../../src/manual/types';

class FakeRuntime implements TutorialRuntimeLike {
  readonly calls: string[] = [];
  private stopped = false;

  async controlledDelay(milliseconds: number): Promise<void> {
    this.calls.push(`delay:${milliseconds}`);
  }

  isStopRequested(): boolean {
    return this.stopped;
  }

  async recordEvidence(): Promise<ManualStep> {
    this.calls.push('capture');
    return {
      id: 'fake-step',
      kind: 'checkpoint',
      label: 'fake',
      timestamp: new Date().toISOString(),
      consoleLogCount: 0,
      networkIssueCount: 0,
    };
  }

  async setControllerState(state: 'recording' | 'capturing' | 'paused' | 'error'): Promise<void> {
    this.calls.push(`state:${state}`);
  }

  async waitWhilePaused(): Promise<void> {
    this.calls.push('waitWhilePaused');
  }
}

class FakeOverlay implements TutorialOverlayLike {
  constructor(private readonly calls: string[]) {}

  async show(): Promise<void> {
    this.calls.push('showOverlay');
  }

  async hide(): Promise<void> {
    this.calls.push('hideOverlay');
  }
}

test('guided tutorial hides transient overlays before evidence capture', async () => {
  const runtime = new FakeRuntime();
  const overlay = new FakeOverlay(runtime.calls);
  const executor = new TutorialStepExecutor(
    runtime,
    overlay,
    { stepDelayMs: 10, captureDelayMs: 5 },
    { page: {} as never },
  );

  await executor.runStep({
    id: 'unit-step',
    title: 'Unit Step',
    description: 'Verify order',
    action: async () => {
      runtime.calls.push('action');
    },
  });

  expect(runtime.calls).toEqual([
    'waitWhilePaused',
    'state:recording',
    'showOverlay',
    'delay:10',
    'action',
    'delay:5',
    'hideOverlay',
    'state:capturing',
    'capture',
    'state:recording',
    'delay:5',
  ]);
});
