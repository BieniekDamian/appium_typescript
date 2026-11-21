import { requireEnv } from './env.js';

const APP_PACKAGE = requireEnv('APP_PACKAGE');

/**
 * Device-level actions: things a user does with the PHONE, not with the page.
 * They live outside the screen objects because they don't belong to any one screen.
 */

/** Presses the system Back button (the gesture or the navigation-bar button). */
export async function pressSystemBack(): Promise<void> {
	await driver.back();
}

/**
 * Sends the app to the background for `seconds`, then brings it back.
 * `mobile: backgroundApp` blocks for the whole time and restores the app by itself, like a user
 * pressing Home and then returning through the recent apps. The extra `getPageSource()` makes the
 * WebView rebuild its accessibility tree, which can be stale right after the app returns.
 */
export async function sendAppToBackground(seconds: number): Promise<void> {
	await driver.execute('mobile: backgroundApp', { seconds });
	await driver.getPageSource();
}

/** Is the app under test the app in the foreground right now? */
export async function isAppInForeground(): Promise<boolean> {
	return (await driver.getCurrentPackage()) === APP_PACKAGE;
}

/**
 * Brings the app back if something (e.g. a Back press that closed it) left it in the background.
 * Call it in `afterEach` of specs that press system keys. All specs share ONE Appium session, so an
 * app left on the launcher would not fail only that spec: every later spec would wait 30 s for a
 * known screen and fail too, burying the real result under a pile of unrelated errors.
 */
export async function ensureAppInForeground(): Promise<void> {
	if (await isAppInForeground()) return;
	await driver.activateApp(APP_PACKAGE);
	await driver.getPageSource();
}

/**
 * Observes a state for AT LEAST `ms` milliseconds and answers whether it held the WHOLE time.
 *
 * ONLY for proving an absence ("nothing happened", e.g. Back was ignored). To wait for something to
 * HAPPEN use `waitUntil` / `waitUntilTree`; do not copy this as a general sleep.
 *
 * Why it exists: when nothing happens you can't wait for an event, because none comes. A single check
 * right after the key press could run before a slow reaction, so we watch for a short window
 * instead. It is a bounded observation, not a blind pause: it ends early the moment the state
 * breaks. Each round re-reads the tree because the WebView can keep reporting an old state until it
 * is refreshed. A round also costs a tree read, so the real duration is a little over `ms`.
 */
export async function staysTrueFor(
	condition: () => Promise<boolean>,
	ms = 4_000,
	intervalMs = 1_000,
): Promise<boolean> {
	const deadline = Date.now() + ms;
	while (Date.now() < deadline) {
		await driver.getPageSource();
		if (!(await condition())) return false;
		await driver.pause(intervalMs);
	}
	return true;
}
