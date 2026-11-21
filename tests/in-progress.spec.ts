import { ensureNotInList, openLibraryList, openTitleFromSearch } from '../src/flows/library.flow.js';
import { libraryScreen } from '../src/screens/library.screen.js';
import { titleScreen } from '../src/screens/title.screen.js';

// Test data: category tab, what we type, what the suggestion row says, what the Library row says.
const CATEGORY = 'Series';
const QUERY = 'Game of Thrones';
const SEARCH_RESULT = 'Game of Thrones 2011';
const LIBRARY_ROW = 'Game of Thrones';
const SEASON = 1; // the cleanup in library.flow.ts un-marks this same season

/**
 * Search the series "Game of Thrones" -> mark season 1 as watched -> it must appear in
 * Library -> In progress. A series has no "In progress" button: the status comes from marked
 * episodes, so we mark a whole season. Modifies the real account, so the season is un-marked
 * again before and after the test.
 */
describe('In progress: Game of Thrones', () => {
	before(async () => {
		await ensureNotInList('In progress', LIBRARY_ROW); // precondition
	});

	after(async () => {
		await ensureNotInList('In progress', LIBRARY_ROW); // postcondition / cleanup
	});

	it('marks season 1 as watched and lists the series in Library -> In progress', async () => {
		await openTitleFromSearch(QUERY, SEARCH_RESULT, CATEGORY);
		await titleScreen.markWholeSeason(SEASON);
		await titleScreen.goBack();

		await openLibraryList('In progress');
		await libraryScreen.waitForTitle(LIBRARY_ROW);
		await expect(libraryScreen.titleRow(LIBRARY_ROW)).toBeDisplayed();
	});
});
