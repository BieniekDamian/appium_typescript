import { BaseScreen } from './base.screen.js';

/** Category tabs at the top of the expanded panel; "Films" is selected by default. */
export type SearchCategory = 'Films' | 'Series' | 'Books' | 'Games' | 'Board games';

/**
 * Search on Home. It has two states:
 *  1. collapsed: a <button> that only LOOKS like an input (the "search bar"),
 *  2. expanded: a full-screen panel with the real text field and suggestions.
 */
class SearchScreen extends BaseScreen {
	// --- collapsed state (lives on Home) ---
	get searchBar() {
		// An aria-label: Chrome exposes it as content-desc (it was `text` in older dumps; check the dump).
		return this.byA11y("Search for a title or person, or tell Ray what you're after");
	}

	// --- expanded panel ---
	get closeButton() {
		return this.byA11y('Close search');
	}

	get clearButton() {
		return this.byA11y('Clear the field');
	}

	categoryTab(name: SearchCategory) {
		return this.byToggle(name);
	}

	get input() {
		return this.byClass('android.widget.EditText');
	}

	/** A suggestion row, e.g. result('The Matrix 1999'): title + year as the app shows it. */
	result(label: string) {
		return this.byText(label);
	}

	/**
	 * Opens the panel and ALWAYS selects a category (Films by default). The app remembers the last
	 * category across sessions, so a spec that searched Series would otherwise leave every later
	 * film search looking in Series ("Matrix" then finds a 1993 Canadian show, not the film).
	 */
	async open(category: SearchCategory = 'Films'): Promise<void> {
		// click() doesn't wait for the element to exist, and the WebView tree may not list it yet.
		await this.waitUntilTree(async () => this.searchBar.isDisplayed(), 'Search bar not found on Home');
		await this.searchBar.click();
		await this.waitForLoaded();
		await this.selectCategory(category);
	}

	/** Switch category BEFORE typing: results only list titles of the selected category. */
	async selectCategory(name: SearchCategory): Promise<void> {
		await this.categoryTab(name).click();
	}

	async type(query: string): Promise<void> {
		await this.input.setValue(query);
	}

	async clear(): Promise<void> {
		await this.clearButton.click();
	}

	/** Waits until the field is really empty: the clear button exists only while the field has text. */
	async waitForCleared(): Promise<void> {
		await this.waitUntilTree(
			async () => !(await this.clearButton.isDisplayed()),
			'Search field still shows the clear button after clearing',
		);
	}

	/** Closes the panel and waits until it is really gone, so the next step starts from a clean Home. */
	async close(): Promise<void> {
		await this.closeButton.click();
		await this.waitUntilTree(
			async () => !(await this.closeButton.isDisplayed()),
			'Search panel is still open after pressing the X',
		);
	}

	/** Waits for an element that exists only in the expanded panel. */
	async waitForLoaded(): Promise<void> {
		await this.closeButton.waitForDisplayed({ timeout: 15_000 });
	}
}

export const searchScreen = new SearchScreen();
