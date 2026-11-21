import { goHome } from '../src/flows/library.flow.js';
import { homeScreen } from '../src/screens/home.screen.js';
import { notificationsScreen } from '../src/screens/notifications.screen.js';

/**
 * Notifications sheet. Read-only: "Mark all as read" and "Clear all" change the account and are
 * never tapped. Opening the sheet does not mark anything as read (checked by hand).
 */
describe('Notifications', () => {
	beforeEach(async () => {
		await goHome(); // also closes the sheet if a previous test left it open
	});

	it('opens the sheet from the bell and closes it back to Home', async () => {
		await notificationsScreen.open();
		await notificationsScreen.waitForLoaded();

		await notificationsScreen.close();

		await homeScreen.waitForLoaded();
		await expect(homeScreen.notificationsButton).toBeDisplayed();
	});

	// `function`, not an arrow: Mocha's `this.skip()` needs Mocha's `this`.
	it('shows the same unread count on the bell and in the sheet', async function () {
		const unread = await homeScreen.unreadNotifications();
		// Tests never create notifications, so with nothing unread there is nothing to compare.
		if (unread === 0) this.skip();

		await notificationsScreen.open();

		expect(await notificationsScreen.unreadInSummary()).toBe(unread);
	});
});
