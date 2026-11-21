import { findWebViewContext, listContexts, switchToNative } from '../src/utils/context.js';
import { requireEnv } from '../src/utils/env.js';

const APP_PACKAGE = requireEnv('APP_PACKAGE');

/**
 * First test to run. It checks the basics and prints what Appium can see, so you
 * know whether the WebView is reachable before writing real tests.
 */
describe('Smoke: app under test', () => {
	after(async () => {
		await switchToNative();
	});

	it('launches the app in the foreground', async () => {
		expect(await driver.getCurrentPackage()).toBe(APP_PACKAGE);
		console.log(`Current activity: ${await driver.getCurrentActivity()}`);
	});

	it('exposes the WebView to Appium', async function () {
		const webview = await findWebViewContext();
		console.log(`Available contexts: ${(await listContexts()).join(', ')}`);

		if (!webview) {
			console.warn(
				'No WEBVIEW context: this build has WebView debugging off. ' +
					'Tests will have to use the native accessibility tree instead of data-testid.',
			);
			this.skip();
		}

		await driver.switchContext(webview!);
		const url = await browser.getUrl();
		console.log(`WebView URL: ${url}`);
		expect(url).toContain(requireEnv('APP_WEB_HOST'));
	});
});
