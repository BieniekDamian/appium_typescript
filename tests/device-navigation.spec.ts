import { goHome, openTitleFromSearch } from '../src/flows/library.flow.js';
import { homeScreen } from '../src/screens/home.screen.js';
import { navBar } from '../src/screens/nav-bar.js';
import { titleScreen } from '../src/screens/title.screen.js';
import {
	ensureAppInForeground,
	isAppInForeground,
	pressSystemBack,
	sendAppToBackground,
	staysTrueFor,
} from '../src/utils/device.js';

// Test data: a read-only title (nothing is saved, rated or changed on the account).
const QUERY = 'Matrix';
const SEARCH_RESULT = 'The Matrix 1999';
const TITLE = 'The Matrix';

const SECONDS_IN_BACKGROUND = 5;

/**
 * Things a user does with the phone rather than with the page: system Back and leaving the app.
 * Read-only, so it needs no cleanup. Each test starts from Home (`beforeEach`).
 *
 * OBSERVED BEHAVIOUR of the store build (2026-11-21), which the Back tests record: the system
 * Back button is ignored on every screen we tried by hand (Home, the search panel, the Library tab,
 * a title page): the app neither goes back nor closes. The tests below cover Home and a title page.
 * If the app starts handling Back, those two tests fail on purpose: update them to the new
 * behaviour instead of "fixing" the app.
 */
describe('Device: system Back and the app in the background', () => {
	beforeEach(async () => {
		await goHome();
	});

	// If the app ever EXITS on Back, a failing test must not leave it on the launcher: the specs
	// after this one share the session and would all fail with "No known screen".
	afterEach(async () => {
		await ensureAppInForeground();
	});

	it('returns to the same Home screen, still signed in, after the app was in the background', async () => {
		await sendAppToBackground(SECONDS_IN_BACKGROUND);

		await homeScreen.waitForLoaded();
		await expect(navBar.tab('Library')).toBeDisplayed(); // the signed-in shell, not a login screen
		expect(await isAppInForeground()).toBe(true);
	});

	it('returns to the same title page after the app was in the background', async () => {
		await openTitleFromSearch(QUERY, SEARCH_RESULT);

		await sendAppToBackground(SECONDS_IN_BACKGROUND);

		await titleScreen.waitForLoaded();
		await expect(titleScreen.heading(TITLE)).toBeDisplayed();
		expect(await isAppInForeground()).toBe(true);
	});

	it('ignores system Back on Home: the app stays open on Home', async () => {
		await pressSystemBack();

		const unchanged = await staysTrueFor(
			async () => (await isAppInForeground()) && (await homeScreen.recommendationsHeading.isDisplayed()),
		);
		expect(unchanged).toBe(true);
	});

	it('ignores system Back on a title page: the page stays open', async () => {
		await openTitleFromSearch(QUERY, SEARCH_RESULT);

		await pressSystemBack();

		// Two signals that belong to the title page, plus the ABSENCE of Home. The heading text alone
		// could be a leftover in the WebView tree if Back had really changed the screen.
		const unchanged = await staysTrueFor(
			async () =>
				(await isAppInForeground()) &&
				(await titleScreen.heading(TITLE).isDisplayed()) &&
				(await titleScreen.watchedToggle.isDisplayed()) &&
				!(await homeScreen.recommendationsHeading.isDisplayed()),
		);
		expect(unchanged).toBe(true);
	});
});
