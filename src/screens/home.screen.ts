import { BaseScreen } from './base.screen.js';
import { navBar } from './nav-bar.js';

/** Home screen of a logged-in user. */
class HomeScreen extends BaseScreen {
	get recommendationsHeading() {
		return this.byHtmlId('home-recs-heading');
	}

	get discoverHeading() {
		return this.byHtmlId('home-discover-heading');
	}

	get profileButton() {
		return this.byA11y('Go to profile');
	}

	get notificationsButton() {
		return this.byA11y('Notifications');
	}

	/** Taps the Home tab and waits until Home has loaded. Does NOT close the search panel. */
	async backToStart(): Promise<void> {
		await navBar.waitForDisplayed();
		await navBar.open('Home');
		await this.waitForLoaded();
	}

	async waitForLoaded(): Promise<void> {
		await this.recommendationsHeading.waitForDisplayed({ timeout: 30_000 });
	}
}

export const homeScreen = new HomeScreen();
