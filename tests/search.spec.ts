import { goHome } from '../src/flows/library.flow.js';
import { homeScreen } from '../src/screens/home.screen.js';
import { searchScreen } from '../src/screens/search.screen.js';

/**
 * Requires a logged-in app (see README → Login). Search creates no data.
 *
 * We go to Home ONCE (`before`), not before every test: each test ends with the panel closed
 * (`close()` waits for it, `afterEach` closes it if a test failed), so the next one already starts on Home.
 */
describe('Search', () => {
	before(async () => {
		await goHome(); // also dismisses the finish-profile prompt if the app shows it
	});

	afterEach(async () => {
		// Leave Home in its collapsed state for the next test, even if this one failed.
		if (await searchScreen.closeButton.isDisplayed()) {
			await searchScreen.close();
		}
	});

	it('opens the search panel from Home', async () => {
		await searchScreen.open();

		await expect(searchScreen.input).toBeDisplayed();
		await expect(searchScreen.closeButton).toBeDisplayed();
	});

	it('suggests a title while typing', async () => {
		await searchScreen.open();
		await searchScreen.type('Matrix');

		await expect(searchScreen.result('The Matrix 1999')).toBeDisplayed();
	});

	it('clears the typed text with the X inside the field', async () => {
		await searchScreen.open();
		await searchScreen.type('Matrix');
		await expect(searchScreen.result('The Matrix 1999')).toBeDisplayed();

		await searchScreen.clear();

		await searchScreen.waitForCleared();
		await expect(searchScreen.result('The Matrix 1999')).not.toBeDisplayed();
	});

	it('closes the search panel with the X and returns to Home', async () => {
		await searchScreen.open();

		await searchScreen.close();

		await homeScreen.waitForLoaded();
		await expect(searchScreen.searchBar).toBeDisplayed();
		await expect(searchScreen.closeButton).not.toBeDisplayed();
	});
});
