import { BaseScreen } from './base.screen.js';
import { homeScreen } from './home.screen.js';

/**
 * Notifications sheet, opened from the bell on Home. It covers the whole screen, bottom nav
 * included, and the system Back button is ignored by the app, so it can only be left with Close.
 */
class NotificationsScreen extends BaseScreen {
	get heading() {
		return this.byTextView('Notifications');
	}

	/** "1 new notification" / "3 new notifications". */
	get unreadSummary() {
		return this.byTextMatches('^\\d+ new notifications?$');
	}

	// An aria-label that lands in `text` here (not content-desc): checked in the dump.
	get closeButton() {
		return this.byButton('Close');
	}

	/** Number from the "N new notification(s)" line. */
	async unreadInSummary(): Promise<number> {
		const text = await this.unreadSummary.getText();
		return Number(text.match(/^(\d+)/)?.[1]);
	}

	async open(): Promise<void> {
		await this.tapUntil(
			homeScreen.notificationsButton,
			async () => this.closeButton.isDisplayed(),
			'The notifications sheet did not open',
		);
	}

	/** Closes the sheet and waits until it is really gone (the old tree can linger). */
	async close(): Promise<void> {
		await this.closeButton.click();
		await this.waitUntilTree(
			async () => !(await this.closeButton.isDisplayed()),
			'The notifications sheet is still open after Close',
		);
	}

	async waitForLoaded(): Promise<void> {
		await this.heading.waitForDisplayed({ timeout: 15_000 });
	}
}

export const notificationsScreen = new NotificationsScreen();
