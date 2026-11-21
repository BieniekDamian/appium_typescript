import { goHome } from '../src/flows/library.flow.js';
import { homeScreen } from '../src/screens/home.screen.js';
import { libraryScreen } from '../src/screens/library.screen.js';
import { navBar } from '../src/screens/nav-bar.js';

/** Requires a logged-in app (see README → Login). */
describe('Home', () => {
	beforeEach(async () => {
		await goHome(); // also dismisses the finish-profile prompt if the app shows it
	});

	it('shows the main sections and navigation', async () => {
		await expect(homeScreen.recommendationsHeading).toBeDisplayed();
		await expect(homeScreen.discoverHeading).toBeDisplayed();
		await expect(homeScreen.profileButton).toBeDisplayed();
		for (const tab of ['Home', 'Library', 'Ask Ray', 'Discover', 'Journal'] as const) {
			await expect(navBar.tab(tab)).toBeDisplayed();
		}
	});

	it('goes to Library and back to Home', async () => {
		// Check for the target screen's own elements: hidden parts of the previous
		// page can stay in the WebView's accessibility tree for a while.
		await navBar.open('Library');
		await libraryScreen.waitForLoaded();
		await expect(libraryScreen.moviesFilter).toBeDisplayed();

		await navBar.open('Home');
		await homeScreen.waitForLoaded();
	});
});
