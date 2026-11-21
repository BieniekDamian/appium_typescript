import { BaseScreen } from './base.screen.js';

export type DiscoverTab = 'Paths' | 'Credits' | 'Lists' | 'Trending';

/**
 * Discover tab. Four sub-tabs; each opens with a one-line intro under the tabs, which is what we
 * use to tell them apart. The content below the intro (trending titles, public lists) changes week
 * to week, so tests check the structure, not the titles.
 */
class DiscoverScreen extends BaseScreen {
	// Tab labels are aria-labels -> content-desc. "Lists" also exists in Library and Journal, so
	// waitForLoaded() relies on "Paths", which only Discover has.
	tab(name: DiscoverTab) {
		return this.byA11y(name);
	}

	/** The intro line each tab shows first. */
	intro(name: DiscoverTab) {
		const intros: Record<DiscoverTab, string> = {
			Paths: 'Routes through a taste, one film at a time',
			Credits: 'The people behind what you watch',
			Lists: 'Lists other people made public',
			Trending: 'What others are watching, reading and playing right now',
		};
		return this.byTextView(intros[name]);
	}

	/** Trending -> the "Trending movies and TV series" rail (stable HTML id). */
	get trendingMoviesRail() {
		return this.byHtmlId('trending-screen-rail');
	}

	/** Opens a sub-tab and waits for ITS intro (the previous tab's text may linger in the tree). */
	async openTab(name: DiscoverTab): Promise<void> {
		await this.tapUntil(
			this.tab(name),
			async () => this.intro(name).isDisplayed(),
			`Discover tab "${name}" did not open`,
		);
	}

	async waitForLoaded(): Promise<void> {
		await this.tab('Paths').waitForDisplayed({ timeout: 30_000 });
	}
}

export const discoverScreen = new DiscoverScreen();
