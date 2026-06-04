import path from 'path';
import dotenv from 'dotenv';
import { ManualSessionOptions, ManualSessionRuntime, getDefaultManualOptions } from '../manual/session';
import { GuidedTutorialRunner } from './guided-tutorial';
import { GuidedTutorialOptions, TutorialMode } from './types';

function loadEnvironment(): void {
  const env = process.env.TEST_ENV || 'staging';
  dotenv.config({ path: path.resolve(process.cwd(), `env/.env.${env}`) });
}

function readArg(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function hasArg(args: string[], name: string): boolean {
  return args.includes(name);
}

function resolveCliPath(value: string | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function parseManualOptions(args: string[]): ManualSessionOptions {
  const defaults = getDefaultManualOptions();
  const targetUrl = readArg(args, '--url')
    || process.env.TUTORIAL_TARGET_URL
    || defaults.targetUrl;
  const port = readArg(args, '--port') || process.env.TUTORIAL_AGENT_PORT;
  const width = readArg(args, '--width') || process.env.TUTORIAL_VIEWPORT_WIDTH;
  const height = readArg(args, '--height') || process.env.TUTORIAL_VIEWPORT_HEIGHT;

  return {
    ...defaults,
    targetUrl,
    baseURL: process.env.TUTORIAL_BASE_URL || getBaseURL(targetUrl) || defaults.baseURL,
    port: port ? Number(port) : defaults.port,
    reportRoot: resolveCliPath(
      readArg(args, '--report-root') || process.env.TUTORIAL_REPORT_ROOT,
      path.join(process.cwd(), 'test-artifacts'),
    ),
    userDataDir: resolveCliPath(
      readArg(args, '--profile') || process.env.TUTORIAL_PROFILE_DIR,
      path.join(process.cwd(), 'test-artifacts', 'tutorial-profile'),
    ),
    extensionDir: resolveCliPath(readArg(args, '--extension'), defaults.extensionDir),
    sessionName: readArg(args, '--name')
      || process.env.TUTORIAL_SESSION_NAME
      || 'Guided Sauce Demo Tutorial',
    proxy: readArg(args, '--proxy') || defaults.proxy,
    browserChannel: readArg(args, '--browser-channel') || defaults.browserChannel,
    viewport: {
      width: width ? Number(width) : defaults.viewport.width,
      height: height ? Number(height) : defaults.viewport.height,
    },
  };
}

function getBaseURL(value: string): string | undefined {
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function parseTutorialOptions(args: string[]): GuidedTutorialOptions {
  const mode = (readArg(args, '--mode')
    || process.env.TUTORIAL_MODE
    || 'autoplay') as TutorialMode;
  return {
    mode,
    timing: {
      stepDelayMs: Number(readArg(args, '--step-delay') || process.env.TUTORIAL_STEP_DELAY_MS || 3000),
      captureDelayMs: Number(readArg(args, '--capture-delay') || process.env.TUTORIAL_CAPTURE_DELAY_MS || 3000),
    },
    pauseOnFailure: parseBoolean(
      readArg(args, '--pause-on-failure') || process.env.TUTORIAL_PAUSE_ON_FAILURE,
      false,
    ),
  };
}

function printHelp(): void {
  console.log(`
Guided Tutorial Recorder

Usage:
  npm run tutorial:start -- --url https://www.saucedemo.com

Options:
  --url <url>                 Target URL
  --mode <autoplay|step>      Tutorial mode (default: autoplay)
  --step-delay <ms>           Delay before each action
  --capture-delay <ms>        Delay before and after evidence capture
  --pause-on-failure <bool>   Keep the browser open for code review on failure
  --port <number>             Local controller WebSocket port
  --report-root <path>        Tutorial report output directory
  --profile <path>            Persistent browser profile directory
  --browser-channel <name>    Browser channel, for example chrome
`);
}

async function main(): Promise<void> {
  loadEnvironment();
  const args = process.argv.slice(2);
  if (hasArg(args, '--help') || hasArg(args, '-h')) {
    printHelp();
    return;
  }

  const runtime = new ManualSessionRuntime(parseManualOptions(args));
  const tutorial = new GuidedTutorialRunner(runtime, parseTutorialOptions(args));

  process.once('SIGINT', () => {
    console.log('\nStopping tutorial and generating report...');
    void runtime.finish('interrupted');
  });

  console.log('Starting guided tutorial. Open the Testing Companion extension for pause/resume/stop controls.');
  const report = await tutorial.run();
  console.log('\nGuided tutorial report ready:');
  console.log(`HTML: ${report.htmlUrl}`);
  console.log(`ZIP: ${report.zipPath}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
