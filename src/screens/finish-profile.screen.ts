import { BaseScreen } from './base.screen.js';

/**
 * "Let's finish your taste profile." — full-screen prompt (web route /hello) that the app shows
 * at start to a logged-in account whose onboarding was never finished. It covers the bottom nav,
 * so every flow that starts from Home fails until it is dismissed.
 * "Look around first" only lets the user into /home; it changes nothing on the account.
 */
class FinishProfileScreen extends BaseScreen {
	get lookAroundButton() {
		return this.byButton('Look around first');
	}

	/** Taps "Look around first" until the prompt is gone (an early tap can be ignored while loading). */
	async lookAround(): Promise<void> {
		await this.tapUntil(
			this.lookAroundButton,
			async () => !(await this.lookAroundButton.isDisplayed()),
			'"Look around first" did not close the finish-profile prompt',
		);
	}
}

export const finishProfileScreen = new FinishProfileScreen();
