import { openTitleFromSearch } from '../src/flows/library.flow.js';
import { homeScreen } from '../src/screens/home.screen.js';
import { searchScreen } from '../src/screens/search.screen.js';
import { titleScreen } from '../src/screens/title.screen.js';

/**
 * Search → open "The Matrix" → check the details page.
 * Read-only: nothing is saved, rated or changed on the account.
 * Not asserted on purpose: ratings and rental/streaming info, which change over time.
 *
 * We navigate ONCE (`before`) and all tests inspect the same page: the first three only read,
 * so repeating the ~15 s navigation for each would be pure waste. The tests are therefore
 * ordered: the synopsis test scrolls far down, so it comes after the top-of-page checks, and
 * "goes back" must stay LAST, because it leaves the details page.
 */
describe('Title details: The Matrix', () => {
	before(async () => {
		// The flow also waits for the suggestion before tapping it (click() alone does not wait).
		await openTitleFromSearch('Matrix', 'The Matrix 1999');
	});

	after(async () => {
		// If a failure left the search panel open, close it so the next spec starts clean.
		if (await searchScreen.closeButton.isDisplayed()) {
			await searchScreen.close();
		}
	});

	it('shows the header with title and year', async () => {
		await expect(titleScreen.backButton).toBeDisplayed();
		await expect(titleScreen.shareButton).toBeDisplayed();
		await expect(titleScreen.heading('The Matrix')).toBeDisplayed();
		await expect(titleScreen.factsContaining('1999')).toBeDisplayed();
	});

	it('shows the trailer button and the library options', async () => {
		await expect(titleScreen.trailerButton).toBeDisplayed();
		await expect(titleScreen.watchedToggle).toBeDisplayed();
		await expect(titleScreen.saveOption).toBeDisplayed();
		await expect(titleScreen.notForMeOption).toBeDisplayed();
	});

	it('shows Ray\'s "Is this movie for you?" card', async () => {
		await titleScreen.scrollToForMe();
		await expect(titleScreen.forMeQuestion).toBeDisplayed();
		await expect(titleScreen.forMeCheckButton).toBeDisplayed();
	});

	// Scrolls far down the page, so it must run after the tests that check the top of the page.
	it('shows the synopsis further down the page', async () => {
		await titleScreen.scrollToSynopsis();
		await expect(titleScreen.synopsisHeading).toBeDisplayed();
		await expect(titleScreen.synopsisContaining('computer hacker')).toBeDisplayed();
	});

	it('goes back to Home from the details page', async () => {
		await titleScreen.goBack();

		await homeScreen.waitForLoaded();
		await expect(searchScreen.searchBar).toBeDisplayed();
		await expect(titleScreen.backButton).not.toBeDisplayed();
	});
});
