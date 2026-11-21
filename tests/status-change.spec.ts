import { ensureNotInList, openLibraryList, openTitleFromSearch } from '../src/flows/library.flow.js';
import { libraryScreen } from '../src/screens/library.screen.js';
import { titleScreen } from '../src/screens/title.screen.js';

// Test data: a film no other spec touches, so specs can't change each other's state.
const QUERY = 'Inception';
const SEARCH_RESULT = 'Inception 2010';
const LIBRARY_ROW = 'Inception';

/**
 * A title has ONE library status at a time: marking a Watched title "Not for me" REPLACES the
 * status, so it moves from Library -> Finished to Library -> Not for me.
 * Modifies the real account, so Inception is cleared from both lists before and after the test.
 */
describe('Status change: Inception, Watched -> Not for me', () => {
	// Clears both statuses the test can leave behind. A failure halfway can leave either one.
	async function clearInception(): Promise<void> {
		await ensureNotInList('Not for me', LIBRARY_ROW);
		await ensureNotInList('Finished', LIBRARY_ROW);
	}

	before(clearInception); // precondition
	after(clearInception); // cleanup, also when the test failed halfway

	it('moves Inception from Library -> Finished to Library -> Not for me', async () => {
		// 1. Starting state: Watched, so it is listed under Finished.
		await openTitleFromSearch(QUERY, SEARCH_RESULT);
		await titleScreen.markWatched();
		await titleScreen.goBack();
		await openLibraryList('Finished');
		await libraryScreen.waitForTitle(LIBRARY_ROW);

		// 2. Change the status from the Library row (the way a user would).
		await libraryScreen.openTitle(LIBRARY_ROW);
		await titleScreen.waitForLoaded();
		await titleScreen.markNotForMe();
		await titleScreen.goBack();

		// 3. It left Finished...
		await openLibraryList('Finished');
		expect(await libraryScreen.isTitleListed(LIBRARY_ROW)).toBe(false);

		// 4. ...and is listed under Not for me.
		await openLibraryList('Not for me');
		await libraryScreen.waitForTitle(LIBRARY_ROW);
		await expect(libraryScreen.titleRow(LIBRARY_ROW)).toBeDisplayed();
	});
});
