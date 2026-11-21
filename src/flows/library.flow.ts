import { askRayScreen } from '../screens/ask-ray.screen.js';
import { finishProfileScreen } from '../screens/finish-profile.screen.js';
import { homeScreen } from '../screens/home.screen.js';
import { type LibraryFilter, libraryScreen } from '../screens/library.screen.js';
import { navBar } from '../screens/nav-bar.js';
import { notificationsScreen } from '../screens/notifications.screen.js';
import { type SearchCategory, searchScreen } from '../screens/search.screen.js';
import { titleScreen } from '../screens/title.screen.js';

/**
 * Flows: multi-screen sequences shared by specs (navigation, set-up, cleanup).
 * A screen object describes ONE screen; a flow strings several screens together.
 * Specs call flows and screen objects, and contain no click sequences of their own.
 */

/**
 * Waits until the app shows SOMETHING we recognise, and dismisses the finish-profile prompt if
 * that is what showed. Needed because the prompt can appear a moment after the app starts:
 * a single isDisplayed() right away could check too early and miss it.
 */
async function dismissFinishProfilePrompt(): Promise<void> {
	await driver.waitUntil(
		async () => {
			await driver.getPageSource();
			return (
				(await finishProfileScreen.lookAroundButton.isDisplayed()) ||
				(await navBar.tab('Home').isDisplayed()) ||
				(await searchScreen.closeButton.isDisplayed()) ||
				(await notificationsScreen.closeButton.isDisplayed())
			);
		},
		{
			timeout: 30_000,
			interval: 1_000,
			timeoutMsg: 'No known screen (Home, search, notifications, prompt) appeared',
		},
	);
	if (await finishProfileScreen.lookAroundButton.isDisplayed()) {
		await finishProfileScreen.lookAround();
	}
}

/**
 * Closes overlays that cover the bottom nav. The app ignores the system Back button, so each one
 * needs its own close control; an overlay left open by a failed test would otherwise block every
 * later spec (they all share one session).
 */
async function closeOverlays(): Promise<void> {
	if (await notificationsScreen.closeButton.isDisplayed()) {
		await notificationsScreen.close();
	}
	if (await askRayScreen.historyIntro.isDisplayed()) {
		await askRayScreen.closeHistory();
	}
}

/**
 * Leaves whatever screen the app is on (prompt, overlays, title page, search panel) and lands on
 * Home. Tabs such as Discover, Journal, Profile or Ask Ray keep the bottom nav, so the Home tab
 * takes us back from them.
 */
export async function goHome(): Promise<void> {
	await dismissFinishProfilePrompt();
	await closeOverlays();
	if (await titleScreen.backButton.isDisplayed()) {
		await titleScreen.goBack();
	}
	await homeScreen.backToStart();
	if (await searchScreen.closeButton.isDisplayed()) {
		await searchScreen.close();
	}
}

/**
 * Home -> search -> details page of one title. Leaves the app on the title page.
 * `suggestion` is the row text as the app shows it: title + year, e.g. 'Avatar 2009'.
 * `category` defaults to Films; pass 'Series' etc. for other kinds of titles.
 */
export async function openTitleFromSearch(
	query: string,
	suggestion: string,
	category: SearchCategory = 'Films',
): Promise<void> {
	await goHome();
	await searchScreen.open(category);
	await searchScreen.type(query);
	await searchScreen.result(suggestion).waitForDisplayed({ timeout: 15_000 });
	await searchScreen.result(suggestion).click();
	await titleScreen.waitForLoaded();
}

/** Home -> Library -> one status chip (e.g. 'Finished', 'Not for me'). */
export async function openLibraryList(filter: LibraryFilter): Promise<void> {
	await goHome();
	await navBar.open('Library');
	await libraryScreen.waitForLoaded();
	await libraryScreen.openFilter(filter);
}

/** How to undo each status on the title page. A filter without an entry cannot be cleaned up yet. */
const undoOnTitlePage: Partial<Record<LibraryFilter, () => Promise<void>>> = {
	Saved: () => titleScreen.unsave(),
	Finished: () => titleScreen.unmarkWatched(),
	'Not for me': () => titleScreen.unmarkNotForMe(),
	// Series only. Undoes exactly what the In progress spec does: marking the whole of season 1.
	'In progress': () => titleScreen.unmarkWholeSeason(1),
};

/**
 * Pre/postcondition: guarantees the title is NOT listed under the given Library chip.
 * The Library list is the source of truth (the title page's toggle state is not readable).
 * `row` is the title as the Library list shows it, e.g. 'Avatar'.
 */
export async function ensureNotInList(filter: LibraryFilter, row: string): Promise<void> {
	const undo = undoOnTitlePage[filter];
	if (!undo) throw new Error(`No cleanup defined for the "${filter}" list`);

	await openLibraryList(filter);
	if (!(await libraryScreen.isTitleListed(row))) return; // already clean: nothing to undo or re-check

	await libraryScreen.openTitle(row);
	await titleScreen.waitForLoaded();
	await undo();
	await titleScreen.goBack();
	// We changed something, so verify the condition really holds now.
	await openLibraryList(filter);
	expect(await libraryScreen.isTitleListed(row)).toBe(false);
}
