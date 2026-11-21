import { ensureNotInList, openLibraryList, openTitleFromSearch } from '../src/flows/library.flow.js';
import { libraryScreen } from '../src/screens/library.screen.js';
import { titleScreen } from '../src/screens/title.screen.js';

// Test data: what we type, what the suggestion row says, what the Library row says.
const QUERY = 'Shrek';
const SEARCH_RESULT = 'Shrek 2001';
const LIBRARY_ROW = 'Shrek';

/**
 * Search "Shrek" -> mark as Not for me -> it must appear in Library -> Not for me.
 * Modifies the real account, so Shrek is un-marked again before and after the test.
 */
describe('Not for me: Shrek', () => {
	before(async () => {
		await ensureNotInList('Not for me', LIBRARY_ROW); // precondition
	});

	after(async () => {
		await ensureNotInList('Not for me', LIBRARY_ROW); // postcondition / cleanup
	});

	it('marks Shrek as Not for me and lists it in Library -> Not for me', async () => {
		await openTitleFromSearch(QUERY, SEARCH_RESULT);
		await titleScreen.markNotForMe();
		await titleScreen.goBack();

		await openLibraryList('Not for me');
		await libraryScreen.waitForTitle(LIBRARY_ROW);
		await expect(libraryScreen.titleRow(LIBRARY_ROW)).toBeDisplayed();
	});
});
