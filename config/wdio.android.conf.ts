import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { requireEnv } from '../src/utils/env.js';

const APP_PACKAGE = requireEnv('APP_PACKAGE');
const ARTIFACTS_DIR = path.resolve('artifacts');

/**
 * Capabilities for the Android app under test.
 * Every Appium-specific key needs the `appium:` prefix (W3C rule).
 */
// Cast: WebdriverIO's typings don't list every UiAutomator2 capability (e.g. chromedriverAutodownload).
const capabilities = {
	platformName: 'Android',
	'appium:automationName': 'UiAutomator2',
	'appium:appPackage': APP_PACKAGE,
	...(process.env.APP_ACTIVITY && { 'appium:appActivity': process.env.APP_ACTIVITY }),
	...(process.env.APP_PATH && { 'appium:app': path.resolve(process.env.APP_PATH) }),
	...(process.env.DEVICE_UDID && { 'appium:udid': process.env.DEVICE_UDID }),
	// Keep app data (login session) between runs. Set to false for a clean install state.
	'appium:noReset': true,
	'appium:autoGrantPermissions': true,
	'appium:newCommandTimeout': 240,
	// The app is a WebView app: let Appium fetch the Chromedriver that matches the
	// device's WebView version (needs the allow-insecure flag on the server below).
	'appium:chromedriverAutodownload': true,
	// UiAutomator2 waits for the UI to go idle before every element action (its default: up to
	// 10 000 ms); a WebView is rarely fully idle. 0 = don't wait. Measured 2026-11-15: ~9% faster
	// (find 270 -> 225 ms, click 141 -> 106 ms). State-changing taps go through tapUntil/waitUntilTree,
	// which cover a tap made too early. Override for a run: WAIT_FOR_IDLE=10000 npm test.
	'appium:waitForIdleTimeout': Number(process.env.WAIT_FOR_IDLE ?? 0),
} as WebdriverIO.Capabilities;

export const config: WebdriverIO.Config = {
	runner: 'local',
	// The INNER array groups every spec into ONE worker = one Appium session for the whole run.
	// Saves ~7 s per spec file (session start/stop). Trade-off: a spec that leaves the app in an odd
	// state affects the next one, which is why every spec starts with goHome()/a cleanup flow.
	// `--spec ./tests/x.spec.ts` on the command line still runs a single file.
	specs: [['../tests/**/*.spec.ts']],
	maxInstances: 1,
	capabilities: [capabilities],

	logLevel: 'warn',
	outputDir: 'logs',
	bail: 0,
	waitforTimeout: 15_000,
	connectionRetryTimeout: 120_000,
	connectionRetryCount: 2,

	// Starts the globally installed `appium` for the run, then stops it.
	services: [
		[
			'appium',
			{
				command: 'appium',
				args: {
					allowInsecure: 'uiautomator2:chromedriver_autodownload',
					log: './logs/appium.log',
				},
			},
		],
	],

	framework: 'mocha',
	reporters: ['spec'],
	mochaOpts: {
		ui: 'bdd',
		timeout: 120_000,
	},

	onPrepare() {
		mkdirSync(ARTIFACTS_DIR, { recursive: true });
		mkdirSync('logs', { recursive: true });
	},

	/**
	 * Runs once per session before any test. Granting POST_NOTIFICATIONS up front
	 * stops both the Android permission dialog and the app's own "enable
	 * notifications" sheet (the app only shows it while permission is still askable).
	 */
	async before() {
		await driver.execute('mobile: changePermissions', {
			permissions: 'android.permission.POST_NOTIFICATIONS',
			appPackage: APP_PACKAGE,
			action: 'grant',
		});
	},

	async afterTest(test, _context, { passed }) {
		if (passed) return;
		const safeName = `${test.parent} - ${test.title}`.replace(/[^a-z0-9-_ ]/gi, '_');
		await driver.saveScreenshot(path.join(ARTIFACTS_DIR, `${safeName}.png`));
	},
};
