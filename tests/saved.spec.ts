import { ensureNotInList, openLibraryList, openTitleFromSearch } from '../src/flows/library.flow.js';
import { libraryScreen } from '../src/screens/library.screen.js';
import { titleScreen } from '../src/screens/title.screen.js';

// Test data: a film no other spec touches, so specs can't change each other's state.
const QUERY = 'Interstellar';
const SEARCH_RESULT = 'Interstellar 2014';
const LIBRARY_ROW = 'Interstellar';

/**
 * Search "Interstellar" -> Save -> listed in Library -> Saved -> unsave -> no longer listed.
 * One `it` on purpose: "unsave" needs a saved title, so splitting it would make one test depend
 * on another. Modifies the real account, so the title is unsaved before and after as well.
 */
describe('Saved: Interstellar', () => {
	before(async () => {
		await ensureNotInList('Saved', LIBRARY_ROW); // precondition
	});

	after(async () => {
		await ensureNotInList('Saved', LIBRARY_ROW); // cleanup, also when the test failed halfway
	});

	it('saves Interstellar, lists it in Library -> Saved, then unsaves it', async () => {
		// 1. Save from the title page.
		await openTitleFromSearch(QUERY, SEARCH_RESULT);
		await titleScreen.save();
		await expect(titleScreen.savedOption).toBeDisplayed();
		await titleScreen.goBack();

		// 2. It is listed under Saved.
		await openLibraryList('Saved');
		await libraryScreen.waitForTitle(LIBRARY_ROW);

		// 3. Unsave, starting from the Library row (the way a user would).
		await libraryScreen.openTitle(LIBRARY_ROW);
		await titleScreen.waitForLoaded();
		await titleScreen.unsave();
		await expect(titleScreen.saveOption).toBeDisplayed();
		await titleScreen.goBack();

		// 4. It is gone from Saved.
		await openLibraryList('Saved');
		expect(await libraryScreen.isTitleListed(LIBRARY_ROW)).toBe(false);
	});
});
