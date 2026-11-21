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

	/**
	 * The bell. Its accessible name carries the unread count ("Notifications, 1 unread"), so an exact
	 * match on "Notifications" stops working as soon as something is unread: match the start.
	 */
	get notificationsButton() {
		return this.byA11yStartsWith('Notifications');
	}

	/** Unread count read from the bell's label; 0 when the label has no "N unread" part. */
	async unreadNotifications(): Promise<number> {
		const label = await this.notificationsButton.getAttribute('content-desc');
		const match = label?.match(/(\d+) unread/);
		return match ? Number(match[1]) : 0;
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
