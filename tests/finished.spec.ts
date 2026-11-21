import { ensureNotInList, openLibraryList, openTitleFromSearch } from '../src/flows/library.flow.js';
import { libraryScreen } from '../src/screens/library.screen.js';
import { titleScreen } from '../src/screens/title.screen.js';

// Test data: what we type, what the suggestion row says, what the Library row says.
const QUERY = 'Avatar';
const SEARCH_RESULT = 'Avatar 2009';
const LIBRARY_ROW = 'Avatar';

/**
 * Search "Avatar" -> mark as Watched -> it must appear in Library -> Finished.
 * Modifies the real account, so Avatar is un-marked again before and after the test.
 */
describe('Finished: Avatar', () => {
	before(async () => {
		await ensureNotInList('Finished', LIBRARY_ROW); // precondition
	});

	after(async () => {
		await ensureNotInList('Finished', LIBRARY_ROW); // postcondition / cleanup
	});

	it('marks Avatar as Watched and lists it in Library -> Finished', async () => {
		await openTitleFromSearch(QUERY, SEARCH_RESULT);
		await titleScreen.markWatched();
		await titleScreen.goBack();

		await openLibraryList('Finished');
		await libraryScreen.waitForTitle(LIBRARY_ROW);
		await expect(libraryScreen.titleRow(LIBRARY_ROW)).toBeDisplayed();
	});
});
