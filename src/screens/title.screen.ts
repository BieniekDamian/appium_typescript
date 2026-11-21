import { BaseScreen } from './base.screen.js';

/** Details page of a single title (film / series / book...), e.g. "The Matrix (1999)". */
class TitleScreen extends BaseScreen {
	// --- top bar ---
	// Icon-only buttons: the label is an aria-label, which Chrome exposes as content-desc.
	get backButton() {
		return this.byA11y('Back');
	}

	get shareButton() {
		return this.byA11y('Share');
	}

	// --- header: title and facts. They depend on WHICH title is open, so they take a parameter ---
	heading(title: string) {
		return this.byText(title);
	}

	/**
	 * The facts line under the title is ONE text, e.g. "1999 · 2h 16m · R", so we match a fragment.
	 * (It used to be separate texts per fact, with the director; the redesign dropped the director.)
	 */
	factsContaining(fragment: string) {
		return this.byTextContains(fragment);
	}

	// --- actions ---
	// Icon + "Trailer" on screen, but the accessible name (content-desc) is "Play trailer".
	get trailerButton() {
		return this.byA11y('Play trailer');
	}

	// --- Save (bookmark icon) ---
	// Not a toggle: a Button whose accessible name changes with the state.
	//   not saved -> content-desc "Save"                  (a tap saves)
	//   saved     -> content-desc "Saved. Add to a list"  (a tap opens the "Where to save?" sheet)
	get saveOption() {
		return this.byA11y('Save');
	}

	get savedOption() {
		return this.byA11y('Saved. Add to a list');
	}

	get savedConfirmation() {
		return this.byTextView('Saved for later.');
	}

	get unsavedConfirmation() {
		return this.byTextView('Removed from saved.');
	}

	// "Where to save?" sheet: the library checkbox plus the user's lists, closed with Done.
	get savedInLibraryCheckbox() {
		return this.byCheckBox('Saved Your library');
	}

	get saveSheetDoneButton() {
		return this.byButton('Done');
	}

	async save(): Promise<void> {
		// Success = the button switched to "Saved" (lasting) OR the confirmation line showed
		// (it can vanish before we look, so it can't be the only signal).
		await this.tapUntil(
			this.saveOption,
			async () => (await this.savedOption.isDisplayed()) || (await this.savedConfirmation.isDisplayed()),
			'Tapping Save did not save the title',
		);
	}

	/**
	 * Removes the title from Saved. A tap on "Saved" does not unsave; it opens a sheet where the
	 * "Your library" checkbox is the switch. The change is applied when the sheet closes (Done).
	 */
	async unsave(): Promise<void> {
		await this.tapUntil(
			this.savedOption,
			async () => this.savedInLibraryCheckbox.isDisplayed(),
			'The "Where to save?" sheet did not open',
		);
		await this.savedInLibraryCheckbox.click();
		await this.saveSheetDoneButton.click();
		// Same idea as save(): the button back to "Save" is the lasting signal.
		await this.waitUntilTree(
			async () => (await this.saveOption.isDisplayed()) || (await this.unsavedConfirmation.isDisplayed()),
			'Unsaving did not switch the button back to "Save"',
		);
	}

	// Anchored to its neighbour "Watched": opened from Library, this page is drawn over Library, whose
	// "Not for me" filter chip stays in the tree with identical attributes (seen 2026-11-21).
	get notForMeOption() {
		return this.byToggleBeside('Watched', 'Not for me');
	}

	// --- Ray's "is it for me" question plus a "Check" button ---
	// It appears TWICE on the page (2026-11-15): in a small card under the buttons, and in the
	// "Is it worth watching?" section (HTML id "worth-watching") as "Ray's take". The small card has
	// no id or label, so we read the copy inside the section, which has a stable id.
	// The id was "czy-warto" until the app renamed it (seen 2026-11-21): when this locator suddenly
	// fails with "element wasn't found", re-dump the page and check the id first.
	// Film wording; a series says "Is this show for you?". Once Ray has answered, the question is
	// replaced by the verdict.
	get worthWatchingSection() {
		return this.byHtmlId('worth-watching');
	}

	get forMeQuestion() {
		return this.byTextViewIn(this.worthWatchingSection, 'Is this movie for you?');
	}

	get forMeCheckButton() {
		return this.byButtonIn(this.worthWatchingSection, 'Check');
	}

	/** The section sits just below the fold (its Check button is under the nav bar). */
	async scrollToForMe(): Promise<void> {
		await this.scrollUntilDisplayed(this.forMeCheckButton);
	}

	// --- synopsis: now "What is it about?" + title, about 14 screens down the page ---
	get synopsisHeading() {
		return this.byTextContains('What is it about?');
	}

	synopsisContaining(fragment: string) {
		return this.byTextContains(fragment);
	}

	/** The synopsis sits far below the fold, so it needs many swipes. */
	async scrollToSynopsis(): Promise<void> {
		await this.scrollUntilDisplayed(this.synopsisHeading, 25);
	}

	// --- "Watched" toggle (shown as "Finished" in Library) and the rating dialog it opens ---
	get watchedToggle() {
		return this.byToggle('Watched');
	}

	/** "How was it?" dialog that appears after marking a title as watched. Skip = don't rate. */
	get skipRatingButton() {
		return this.byText('Skip');
	}

	// Confirmation lines shown under the buttons after a change. They are the reliable signal:
	// the toggle's own `checked` attribute stays "false" in the accessibility tree.
	get watchedConfirmation() {
		return this.byTextView('Watched.');
	}

	get removedConfirmation() {
		return this.byTextView('Removed from watched.');
	}

	/** Marks the title as watched and dismisses the rating dialog without rating. */
	async markWatched(): Promise<void> {
		// Success = the rating dialog opened (or, if the app skips it, the confirmation shows).
		await this.tapUntil(
			this.watchedToggle,
			async () =>
				(await this.skipRatingButton.isDisplayed()) || (await this.watchedConfirmation.isDisplayed()),
			'Tapping "Watched" never marked the title',
		);
		if (await this.skipRatingButton.isDisplayed()) {
			await this.skipRatingButton.click();
		}
		await this.waitUntilTree(
			async () => this.watchedConfirmation.isDisplayed(),
			'No "Watched." confirmation after marking the title',
		);
	}

	/** Un-marks a title that is currently Watched (tapping an active toggle clears it). */
	async unmarkWatched(): Promise<void> {
		await this.tapUntil(
			this.watchedToggle,
			async () => this.removedConfirmation.isDisplayed(),
			'No "Removed from watched." confirmation after un-marking',
		);
	}

	// No rating dialog here, only a confirmation line under the buttons.
	get notForMeConfirmation() {
		return this.byTextView('I won’t suggest this again.');
	}

	get notForMeRemovedConfirmation() {
		return this.byTextView('I can suggest this again.');
	}

	async markNotForMe(): Promise<void> {
		await this.tapUntil(
			this.notForMeOption,
			async () => this.notForMeConfirmation.isDisplayed(),
			'No confirmation after marking the title "Not for me"',
		);
	}

	/** Un-marks a title that is currently "Not for me" (tapping the active toggle clears it). */
	async unmarkNotForMe(): Promise<void> {
		await this.tapUntil(
			this.notForMeOption,
			async () => this.notForMeRemovedConfirmation.isDisplayed(),
			'No confirmation after removing "Not for me"',
		);
	}

	// --- series: progress comes from marked episodes, there is no "In progress" button ---
	// The per-episode circles have no label in the accessibility tree, so we use "Whole season".
	get wholeSeasonToggle() {
		return this.byToggle('Whole season');
	}

	/** Status line shown once any episode is marked, e.g. "Watching · 10 of 73 episodes". */
	get watchingStatus() {
		return this.byTextContains('Watching ·');
	}

	/** Season tab, e.g. "Season 1, rated 8.4 out of 10". Matched by the start: the rating changes. */
	seasonTab(season: number) {
		return this.byA11yStartsWith(`Season ${season},`);
	}

	/** Heading of the season currently shown below the tabs, e.g. "Season 1". */
	seasonHeading(season: number) {
		return this.byTextView(`Season ${season}`);
	}

	/** "10 of 10": the counter of the shown season when ALL its episodes are marked (regex: N of N). */
	get seasonCompleteCounter() {
		return this.byTextMatches('^(\\d+) of \\1$');
	}

	/**
	 * Shows the given season. ALWAYS call it before "Whole season": the page opens on the NEXT
	 * unwatched season, so without it "Whole season" acts on whatever season happens to be shown.
	 */
	async openSeason(season: number): Promise<void> {
		await this.scrollUntilDisplayed(this.seasonTab(season));
		await this.seasonTab(season).click();
		// The heading may sit just below the fold, so wait for it to EXIST, then scroll to it.
		await this.waitUntilTree(
			async () => this.seasonHeading(season).isExisting(),
			`Season ${season} not shown after tapping its tab`,
		);
		await this.scrollUntilDisplayed(this.seasonHeading(season));
		await this.scrollUntilDisplayed(this.wholeSeasonToggle);
	}

	async isSeasonComplete(): Promise<boolean> {
		await driver.getPageSource();
		return this.seasonCompleteCounter.isDisplayed();
	}

	/** Marks every episode of the season, which puts the series "In progress". */
	async markWholeSeason(season: number): Promise<void> {
		await this.openSeason(season);
		if (await this.isSeasonComplete()) {
			throw new Error(`Season ${season} is already fully marked; the precondition did not hold`);
		}
		await this.wholeSeasonToggle.click();
		await this.waitUntilTree(
			async () => this.seasonCompleteCounter.isDisplayed(),
			`Season ${season} is not fully marked after tapping "Whole season"`,
		);
	}

	/**
	 * Un-marks the season, but ONLY if it is fully marked. "Whole season" is a toggle: on a season
	 * that is partly marked or empty, a tap would MARK it, which is the opposite of a cleanup.
	 */
	async unmarkWholeSeason(season: number): Promise<void> {
		await this.openSeason(season);
		if (!(await this.isSeasonComplete())) return;
		await this.wholeSeasonToggle.click();
		await this.waitUntilTree(
			async () => !(await this.seasonCompleteCounter.isDisplayed()),
			`Season ${season} is still fully marked after tapping "Whole season"`,
		);
	}

	/**
	 * Waits for Back, taps it, then waits until the page is really gone.
	 * - Before the tap: right after a dialog closes (e.g. the rating dialog), the page behind it is
	 *   briefly hidden from the accessibility tree, so Back is not there yet.
	 * - After the tap: a page opened from Library lies ON TOP of Library, and for a moment the tree
	 *   still holds both layers (two nav bars). Touching the nav bar then fails in strict mode, so
	 *   we only return once the page's own Back button has left the tree.
	 */
	async goBack(): Promise<void> {
		await this.waitUntilTree(async () => this.backButton.isDisplayed(), 'Back button not found');
		await this.backButton.click();
		await this.waitUntilTree(
			async () => !(await this.backButton.isDisplayed()),
			'Still on the title page after tapping Back',
		);
	}

	/** Waits for an element that exists only on a details page (not on Home, whose tree may linger). */
	async waitForLoaded(): Promise<void> {
		await this.backButton.waitForDisplayed({ timeout: 30_000 });
		await this.watchedToggle.waitForDisplayed({ timeout: 30_000 });
	}
}

export const titleScreen = new TitleScreen();
