import { BaseScreen } from './base.screen.js';

/**
 * Ask Ray: chat with the app's assistant. The greeting and the suggested prompts change between
 * visits (and the greeting contains the account name), so we check the composer controls instead.
 * Tests never send a message: that would create a conversation on the real account.
 */
class AskRayScreen extends BaseScreen {
	// Icon-only buttons: aria-label -> content-desc.
	get submitButton() {
		return this.byA11y('Submit');
	}

	get uploadImageButton() {
		return this.byA11y('Upload image');
	}

	get takePhotoButton() {
		return this.byA11y('Take photo');
	}

	get newThreadButton() {
		return this.byA11y('New thread');
	}

	get historyButton() {
		return this.byA11y('History');
	}

	/** Top-left back arrow. With the History panel open it closes the panel, not the chat. */
	get goBackButton() {
		return this.byA11y('Go back');
	}

	// --- History panel ---
	get historyIntro() {
		return this.byTextView('Browse conversation history');
	}

	async openHistory(): Promise<void> {
		await this.tapUntil(
			this.historyButton,
			async () => this.historyIntro.isDisplayed(),
			'History did not open',
		);
	}

	/** Closes the History panel and waits until it is gone. */
	async closeHistory(): Promise<void> {
		await this.goBackButton.click();
		await this.waitUntilTree(
			async () => !(await this.historyIntro.isDisplayed()),
			'History panel is still open after Go back',
		);
	}

	async waitForLoaded(): Promise<void> {
		await this.submitButton.waitForDisplayed({ timeout: 30_000 });
	}
}

export const askRayScreen = new AskRayScreen();
