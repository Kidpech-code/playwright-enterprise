import path from 'path';
import dotenv from 'dotenv';
import { ManualSessionOptions, ManualSessionRuntime, getDefaultManualOptions } from './session';

function loadEnvironment(): void {
  const env = process.env.TEST_ENV || 'staging';
  dotenv.config({ path: path.resolve(process.cwd(), `env/.env.${env}`) });
}

function readArg(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return args[index + 1];
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

function parseOptions(args: string[]): ManualSessionOptions {
  const defaults = getDefaultManualOptions();
  const port = readArg(args, '--port');
  const width = readArg(args, '--width');
  const height = readArg(args, '--height');

  return {
    ...defaults,
    targetUrl: readArg(args, '--url') || defaults.targetUrl,
    port: port ? Number(port) : defaults.port,
    reportRoot: resolveCliPath(readArg(args, '--report-root'), defaults.reportRoot),
    userDataDir: resolveCliPath(readArg(args, '--profile'), defaults.userDataDir),
    extensionDir: resolveCliPath(readArg(args, '--extension'), defaults.extensionDir),
    sessionName: readArg(args, '--name') || defaults.sessionName,
    proxy: readArg(args, '--proxy') || defaults.proxy,
    browserChannel: readArg(args, '--browser-channel') || defaults.browserChannel,
    viewport: {
      width: width ? Number(width) : defaults.viewport.width,
      height: height ? Number(height) : defaults.viewport.height,
    },
  };
}

function printHelp(): void {
  console.log(`
Manual Testing Companion

Usage:
  npm run manual:start -- --url https://example.com

Options:
  --url <url>                 Target URL to open in the managed browser
  --port <number>             Local agent WebSocket port (default: 3737)
  --name <name>               Friendly session name for the report
  --profile <path>            Persistent browser profile directory
  --extension <path>          Chrome extension directory
  --proxy <server>            Proxy server, for example http://127.0.0.1:8080
  --browser-channel <name>    Browser channel, for example chrome or msedge
  --report-root <path>        Directory for manual reports
  --width <number>            Viewport width
  --height <number>           Viewport height
`);
}

async function main(): Promise<void> {
  loadEnvironment();
  const args = process.argv.slice(2);
  if (hasArg(args, '--help') || hasArg(args, '-h')) {
    printHelp();
    return;
  }

  const options = parseOptions(args);
  const runtime = new ManualSessionRuntime(options);

  process.once('SIGINT', () => {
    console.log('\nStopping manual session and generating report...');
    void runtime.finish('interrupted');
  });

  await runtime.start();

  console.log('Manual Testing Companion is running.');
  console.log(`Target: ${options.targetUrl}`);
  console.log(`Agent: ws://127.0.0.1:${options.port}`);
  console.log('Use the Testing Companion extension popup to capture notes, screenshots, bugs, and stop the session.');

  const report = await runtime.waitForCompletion();
  console.log('\nManual report ready:');
  console.log(`HTML: ${report.htmlUrl}`);
  console.log(`ZIP: ${report.zipPath}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
