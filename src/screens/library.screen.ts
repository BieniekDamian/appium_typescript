import { BaseScreen } from './base.screen.js';

/** Status chips of Library -> Titles (the label is the visible text on a toggle button). */
export type LibraryFilter = 'Saved' | 'Recommended' | 'In progress' | 'Finished' | 'Not for me';

/** Library tab: saved / recommended / finished titles, lists and journal. */
class LibraryScreen extends BaseScreen {
	// Top tabs. Their label is an aria-label, which Chrome exposes as content-desc.
	get titlesTab() {
		return this.byA11y('Titles');
	}

	// Type filter chips (All / Movies / Series...): visible text on a toggle button.
	get moviesFilter() {
		return this.byText('Movies');
	}

	// Status chips (Saved / Recommended / In progress / Finished / Not for me).
	filter(name: LibraryFilter) {
		return this.byToggle(name);
	}

	/**
	 * A title row (the clickable card) in the list below the chips, e.g. titleRow('Avatar').
	 * Its accessible name starts with the backdrop image's alt text: "Avatar backdrop Avatar 2009 ...".
	 * Not plain text "Avatar": the title can ALSO appear inside Ray's blurb on the same card
	 * ("...call Interstellar a personal match"), and two matches break strict mode.
	 * " backdrop" also keeps "Shrek" from matching a "Shrek 2" card. Clickable-only, because the
	 * image inside the card is named "<name> backdrop" too.
	 */
	titleRow(name: string) {
		return this.byClickableA11yStartsWith(`${name} backdrop`);
	}

	/** Taps one of the status chips and waits until it is on screen first. */
	async openFilter(name: LibraryFilter): Promise<void> {
		await this.filter(name).waitForDisplayed({ timeout: 15_000 });
		await this.filter(name).click();
	}

	/** Waits (with fresh tree reads) until the title is listed under the active filter. */
	async waitForTitle(name: string): Promise<void> {
		await this.waitUntilTree(
			async () => this.titleRow(name).isDisplayed(),
			`"${name}" not listed in Library`,
		);
	}

	/** Counter above a NON-empty list, e.g. "1 title", "12 titles". */
	get titleCount() {
		return this.byTextMatches('^\\d+ titles?$');
	}

	/** Heading of an EMPTY list; the middle word depends on the chip ("Nothing saved yet", "Nothing finished yet"). */
	get emptyListMessage() {
		return this.byTextMatches('^Nothing .+ yet$');
	}

	/**
	 * Is the title listed under the current filter? A list that is still loading looks the same as
	 * an empty one, so we give it a few seconds to show the row before answering "no".
	 */
	async isTitleListed(name: string): Promise<boolean> {
		try {
			// Wait until the list has visibly LOADED: the row itself, the "N titles" counter (non-empty
			// list) or the "Nothing ... yet" message (empty list). Before this change we always waited
			// the full 6 s to conclude "not listed"; now a loaded list answers in ~1 s.
			await driver.waitUntil(
				async () => {
					await driver.getPageSource();
					return (
						(await this.titleRow(name).isDisplayed()) ||
						(await this.titleCount.isDisplayed()) ||
						(await this.emptyListMessage.isDisplayed())
					);
				},
				{ timeout: 6_000, interval: 1_000 },
			);
			return this.titleRow(name).isDisplayed();
		} catch (error) {
			// Only "not there in time" means "not listed". Any other error (e.g. a locator matching
			// two elements) is a bug in the test and must fail loudly, not pass as "not listed".
			if (error instanceof Error && error.message.includes('timed out')) return false;
			throw error;
		}
	}

	async openTitle(name: string): Promise<void> {
		await this.titleRow(name).click();
	}

	async waitForLoaded(): Promise<void> {
		await this.titlesTab.waitForDisplayed({ timeout: 30_000 });
	}
}

export const libraryScreen = new LibraryScreen();
