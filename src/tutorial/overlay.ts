import { Page } from '@playwright/test';
import { TutorialStep } from './types';

export const TUTORIAL_OVERLAY_ID = '__testing-companion-tutorial-overlay';
export const TUTORIAL_HIGHLIGHT_ID = '__testing-companion-tutorial-highlight';

export class TutorialOverlayController {
  constructor(private readonly page: Page) {}

  async show(step: Pick<TutorialStep, 'title' | 'description' | 'targetSelector'>): Promise<void> {
    await this.page.evaluate(
      ({ overlayId, highlightId, title, description, targetSelector }) => {
        const browserGlobal = globalThis as unknown as {
          document: {
            body: any;
            createElement: (tagName: string) => any;
            documentElement: any;
            getElementById: (id: string) => any;
            querySelector: (selector: string) => any;
          };
        };
        const pageDocument = browserGlobal.document;
        const getRoot = (): any => pageDocument.documentElement || pageDocument.body;

        const hide = (): void => {
          pageDocument.getElementById(overlayId)?.remove();
          pageDocument.getElementById(highlightId)?.remove();
        };

        const root = getRoot();
        if (!root) {
          return;
        }

        hide();

	        const overlay = pageDocument.createElement('aside');
	        overlay.id = overlayId;
	        overlay.className = 'testing-companion-no-capture';
	        overlay.setAttribute('data-testing-companion-transient', 'true');
	        overlay.setAttribute('aria-hidden', 'true');
	        overlay.style.cssText = [
	          'position:fixed',
	          'left:50%',
	          'top:14px',
	          'width:min(760px,calc(100vw - 32px))',
	          'z-index:2147483646',
	          'transform:translateX(-50%)',
	          'padding:10px 14px',
	          'border-radius:8px',
	          'background:rgba(17,24,39,.94)',
	          'color:#f9fafb',
	          'font:13px/1.35 Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
	          'box-shadow:0 14px 32px rgba(15,23,42,.24)',
	          'display:grid',
	          'grid-template-columns:auto minmax(0,1fr)',
	          'gap:12px',
	          'align-items:center',
	          'pointer-events:none'
	        ].join(';');
	
	        const progress = pageDocument.createElement('div');
	        progress.style.cssText = [
	          'width:74px',
	          'height:8px',
	          'border-radius:999px',
	          'overflow:hidden',
	          'background:#374151'
	        ].join(';');
	
	        const progressFill = pageDocument.createElement('div');
	        progressFill.style.cssText = [
	          'height:100%',
	          'width:100%',
	          'border-radius:999px',
	          'background:#22c55e',
	          'animation:testingCompanionProgress 3s linear forwards'
	        ].join(';');
	        progress.appendChild(progressFill);
	
	        const copy = pageDocument.createElement('div');
	        copy.style.cssText = 'min-width:0';
	        const titleElement = pageDocument.createElement('strong');
	        titleElement.style.cssText = 'display:block;font-size:14px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
	        titleElement.textContent = title;
	        const descriptionElement = pageDocument.createElement('span');
	        descriptionElement.style.cssText = 'display:block;color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
	        descriptionElement.textContent = description;
	        copy.appendChild(titleElement);
	        copy.appendChild(descriptionElement);
	
	        const style = pageDocument.createElement('style');
	        style.textContent = '@keyframes testingCompanionProgress{from{transform:translateX(-100%)}to{transform:translateX(0)}}';
	        overlay.appendChild(style);
	        overlay.appendChild(progress);
	        overlay.appendChild(copy);
	        root.appendChild(overlay);

        if (!targetSelector) {
          return;
        }

        const target = pageDocument.querySelector(targetSelector);
        if (!target) {
          return;
        }

        const rect = target.getBoundingClientRect();
	        const highlight = pageDocument.createElement('div');
	        highlight.id = highlightId;
	        highlight.className = 'testing-companion-no-capture';
	        highlight.setAttribute('data-testing-companion-transient', 'true');
        highlight.style.cssText = [
          'position:fixed',
          `left:${Math.max(0, rect.left - 6)}px`,
          `top:${Math.max(0, rect.top - 6)}px`,
          `width:${rect.width + 12}px`,
          `height:${rect.height + 12}px`,
          'border:3px solid #14b8a6',
          'border-radius:8px',
          'z-index:2147483645',
          'box-shadow:0 0 0 9999px rgba(17,24,39,.18)',
          'pointer-events:none'
        ].join(';');
        root.appendChild(highlight);
      },
      {
        overlayId: TUTORIAL_OVERLAY_ID,
        highlightId: TUTORIAL_HIGHLIGHT_ID,
        title: step.title,
        description: step.description,
        targetSelector: step.targetSelector,
      },
    ).catch(() => undefined);
  }

  async hide(): Promise<void> {
    await this.page.evaluate(
      ({ overlayId, highlightId }) => {
        const browserGlobal = globalThis as unknown as {
          document: {
            getElementById: (id: string) => any;
          };
        };
        browserGlobal.document.getElementById(overlayId)?.remove();
        browserGlobal.document.getElementById(highlightId)?.remove();
      },
      {
        overlayId: TUTORIAL_OVERLAY_ID,
        highlightId: TUTORIAL_HIGHLIGHT_ID,
      },
    ).catch(() => undefined);
  }
}
