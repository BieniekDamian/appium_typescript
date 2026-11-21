import { goHome } from '../src/flows/library.flow.js';
import { type DiscoverTab, discoverScreen } from '../src/screens/discover.screen.js';
import { navBar } from '../src/screens/nav-bar.js';

const TABS: DiscoverTab[] = ['Credits', 'Lists', 'Trending', 'Paths'];

/**
 * Discover and its four sub-tabs. Read-only. The content under each tab (trending titles, public
 * lists) changes week to week, so the tests check which tab is shown, not what is in it.
 * We navigate once (`before`): every test only switches tabs on the same screen.
 */
describe('Discover', () => {
	before(async () => {
		await goHome();
		await navBar.open('Discover');
		await discoverScreen.waitForLoaded();
	});

	// One `it` per tab, generated from the list: same steps, different data.
	for (const tab of TABS) {
		it(`switches to the ${tab} tab`, async () => {
			await discoverScreen.openTab(tab);

			await expect(discoverScreen.intro(tab)).toBeDisplayed();
		});
	}

	it('shows the trending movies and TV series rail on Trending', async () => {
		await discoverScreen.openTab('Trending');

		await expect(discoverScreen.trendingMoviesRail).toBeDisplayed();
	});
});
