/**
 * The mobile app is a Natively WebView wrapper around the web app, so
 * almost everything on screen lives inside one WebView. Appium sees two
 * "contexts":
 *   - NATIVE_APP           -> the Android UI tree (system dialogs, permission popups, the shell)
 *   - WEBVIEW_<package>    -> the web page, driven through Chromedriver with CSS selectors
 */

export const NATIVE = 'NATIVE_APP';

type ContextInfo = string | { id: string };

function contextId(ctx: ContextInfo): string {
	return typeof ctx === 'string' ? ctx : ctx.id;
}

export async function listContexts(): Promise<string[]> {
	const contexts = (await driver.getContexts()) as ContextInfo[];
	return contexts.map(contextId);
}

/** Returns the WebView context name, or null if none appears within the timeout. */
export async function findWebViewContext(timeoutMs = 20_000): Promise<string | null> {
	let found: string | null = null;
	try {
		await driver.waitUntil(
			async () => {
				found = (await listContexts()).find((c) => c.startsWith('WEBVIEW')) ?? null;
				return found !== null;
			},
			{ timeout: timeoutMs, interval: 1_000 },
		);
	} catch {
		return null;
	}
	return found;
}

/**
 * Switches into the app's WebView. Throws a readable error when the WebView is
 * not debuggable (typical for store/release builds), because then Appium can
 * only see the page through the native accessibility tree.
 */
export async function switchToWebView(timeoutMs = 20_000): Promise<void> {
	const webview = await findWebViewContext(timeoutMs);
	if (!webview) {
		throw new Error(
			`No WEBVIEW context found (contexts: ${(await listContexts()).join(', ')}). ` +
				'The app build must have WebView debugging enabled (setWebContentsDebuggingEnabled). ' +
				'Check with chrome://inspect/#devices on your PC while the app is open.',
		);
	}
	await driver.switchContext(webview);
}

export async function switchToNative(): Promise<void> {
	await driver.switchContext(NATIVE);
}
