import { BaseScreen } from './base.screen.js';

/**
 * Journal tab: what the user watched/read/played, plus their lists. Tests only check the screen
 * and its "create" buttons, never the entries themselves: the account's journal may fill up.
 */
class JournalScreen extends BaseScreen {
	// "Titles" / "Lists" tabs share their labels with Library, so waitForLoaded() uses the intro.
	get titlesTab() {
		return this.byA11y('Titles');
	}

	get listsTab() {
		return this.byA11y('Lists');
	}

	get titlesIntro() {
		return this.byTextView('What you watched, read or played, and when');
	}

	get newEntryButton() {
		return this.byButton('New entry');
	}

	// The Lists tab is the same component as Library -> Lists.
	get listsIntro() {
		return this.byTextView('Groups of titles around a theme or mood');
	}

	get newListButton() {
		return this.byButton('New list');
	}

	async openLists(): Promise<void> {
		await this.tapUntil(
			this.listsTab,
			async () => this.listsIntro.isDisplayed(),
			'Journal -> Lists did not open',
		);
	}

	async waitForLoaded(): Promise<void> {
		await this.titlesIntro.waitForDisplayed({ timeout: 30_000 });
	}
}

export const journalScreen = new JournalScreen();
