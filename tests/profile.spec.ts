import { goHome } from '../src/flows/library.flow.js';
import { homeScreen } from '../src/screens/home.screen.js';
import { profileScreen, settingsScreen } from '../src/screens/profile.screen.js';

/**
 * Profile and Settings, read-only: nothing on these screens is tapped except navigation.
 * Visibility, Share and every Settings section change the account (CLAUDE.md: ask first).
 */
describe('Profile', () => {
	beforeEach(async () => {
		await goHome();
		await profileScreen.open();
	});

	it('shows the handle and the profile visibility', async () => {
		await expect(profileScreen.heading).toBeDisplayed();
		await expect(profileScreen.handle).toBeDisplayed();
		await expect(profileScreen.visibilityButton).toBeDisplayed();
	});

	it('opens Settings with the main sections and goes back to the profile', async () => {
		await profileScreen.openSettings();

		await expect(settingsScreen.section('Account')).toBeDisplayed();
		await expect(settingsScreen.section('Public profile')).toBeDisplayed();
		await expect(settingsScreen.section('Streaming Services')).toBeDisplayed();
		await expect(settingsScreen.section('App')).toBeDisplayed();

		await settingsScreen.goBack();
		await expect(profileScreen.heading).toBeDisplayed();
	});

	it('goes back to Home with "Go to homepage"', async () => {
		await profileScreen.goToHomepageButton.click();

		await homeScreen.waitForLoaded();
	});
});
