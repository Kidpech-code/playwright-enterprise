import {
  TutorialActionContext,
  TutorialOverlayLike,
  TutorialRuntimeLike,
  TutorialStep,
  TutorialTiming,
} from './types';

export class TutorialStepExecutor {
  constructor(
    private readonly runtime: TutorialRuntimeLike,
    private readonly overlay: TutorialOverlayLike,
    private readonly timing: TutorialTiming,
    private readonly context: TutorialActionContext,
  ) {}

  async runStep(step: TutorialStep): Promise<void> {
    if (this.runtime.isStopRequested()) {
      return;
    }

    await this.runtime.waitWhilePaused();
    await this.runtime.setControllerState('recording', {
      stepId: step.id,
      label: step.title,
    });
    await this.overlay.show(step);
    await this.runtime.controlledDelay(this.timing.stepDelayMs);

    if (this.runtime.isStopRequested()) {
      await this.overlay.hide();
      return;
    }

    await step.action(this.context);
    await this.runtime.controlledDelay(this.timing.captureDelayMs);
    await this.overlay.hide();
    await this.runtime.setControllerState('capturing', {
      stepId: step.id,
      label: step.captureLabel || step.title,
    });
    await this.runtime.recordEvidence('checkpoint', {
      label: step.captureLabel || step.title,
      note: step.description,
      category: 'guided-tutorial',
    });
    await this.runtime.setControllerState('recording', {
      stepId: step.id,
      label: step.title,
    });
    await this.runtime.controlledDelay(this.timing.captureDelayMs);
  }
}
