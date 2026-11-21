import { BaseScreen } from './base.screen.js';
import { homeScreen } from './home.screen.js';

/**
 * Profile (the person icon on Home). The display name and handle belong to the account, so they
 * are never written here: we only check that a handle ("@something") is shown.
 * Read-only: visibility, Share and every Settings entry change the account and are not tapped.
 */
class ProfileScreen extends BaseScreen {
	get heading() {
		return this.byTextView('Profile');
	}

	/** Any "@handle" line. */
	get handle() {
		return this.byTextMatches('^@\\S+$');
	}

	/** "Profile visibility: Private" / "...: Public". Only read, never tapped. */
	get visibilityButton() {
		return this.byA11yStartsWith('Profile visibility:');
	}

	get settingsButton() {
		return this.byButton('Settings');
	}

	get goToHomepageButton() {
		return this.byA11y('Go to homepage');
	}

	/** From Home: taps the person icon until the profile is there. */
	async open(): Promise<void> {
		await this.tapUntil(
			homeScreen.profileButton,
			async () => this.goToHomepageButton.isDisplayed(),
			'The profile did not open',
		);
	}

	async openSettings(): Promise<void> {
		await this.tapUntil(
			this.settingsButton,
			async () => settingsScreen.heading.isDisplayed(),
			'Settings did not open',
		);
	}

	async waitForLoaded(): Promise<void> {
		await this.goToHomepageButton.waitForDisplayed({ timeout: 30_000 });
	}
}

/**
 * Profile -> Settings: a list of section buttons. Each button's text is "<Title> <description>",
 * so sections are matched by their start. Tests open nothing here: every section edits the account.
 */
class SettingsScreen extends BaseScreen {
	get heading() {
		return this.byTextView('Settings');
	}

	section(title: 'Account' | 'Public profile' | 'Streaming Services' | 'App') {
		return this.byButtonStartsWith(`${title} `);
	}

	get goBackButton() {
		return this.byA11y('Go back');
	}

	/** Back to the profile; waits for the profile to be there again. */
	async goBack(): Promise<void> {
		await this.goBackButton.click();
		await this.waitUntilTree(
			async () => !(await this.heading.isDisplayed()) && (await profileScreen.heading.isDisplayed()),
			'Still on Settings after Go back',
		);
	}
}

export const profileScreen = new ProfileScreen();
export const settingsScreen = new SettingsScreen();
