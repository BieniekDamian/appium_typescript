import { BaseScreen } from './base.screen.js';

export type Tab = 'Home' | 'Library' | 'Ask Ray' | 'Discover' | 'Journal';

/** Bottom navigation shown on every main screen of the logged-in app. */
class NavBar extends BaseScreen {
	tab(name: Tab) {
		return this.byA11y(name);
	}

	async open(name: Tab): Promise<void> {
		await this.tab(name).click();
	}

	async waitForDisplayed(): Promise<void> {
		await this.tab('Home').waitForDisplayed({ timeout: 30_000 });
	}
}

export const navBar = new NavBar();
