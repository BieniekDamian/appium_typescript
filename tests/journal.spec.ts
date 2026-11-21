import { goHome } from '../src/flows/library.flow.js';
import { journalScreen } from '../src/screens/journal.screen.js';
import { navBar } from '../src/screens/nav-bar.js';

/**
 * Journal tab. Read-only: we check that each sub-tab offers its "create" button, and do not
 * assert that the journal or the lists are empty, because the account may fill them up.
 */
describe('Journal', () => {
	beforeEach(async () => {
		await goHome();
		await navBar.open('Journal');
		await journalScreen.waitForLoaded();
	});

	it('offers a new entry on the Titles tab', async () => {
		await expect(journalScreen.titlesIntro).toBeDisplayed();
		await expect(journalScreen.newEntryButton).toBeDisplayed();
	});

	it('offers a new list on the Lists tab', async () => {
		await journalScreen.openLists();

		await expect(journalScreen.listsIntro).toBeDisplayed();
		await expect(journalScreen.newListButton).toBeDisplayed();
	});
});
