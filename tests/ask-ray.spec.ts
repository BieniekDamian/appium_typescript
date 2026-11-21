import { goHome } from '../src/flows/library.flow.js';
import { askRayScreen } from '../src/screens/ask-ray.screen.js';
import { navBar } from '../src/screens/nav-bar.js';

/**
 * Ask Ray, without sending anything: a message would start a conversation on the real account,
 * and the answer differs every time. We check the controls that are always there.
 */
describe('Ask Ray', () => {
	beforeEach(async () => {
		await goHome(); // also closes the History panel if a previous test left it open
		await navBar.open('Ask Ray');
		await askRayScreen.waitForLoaded();
	});

	it('shows the message composer with image, camera and send controls', async () => {
		await expect(askRayScreen.submitButton).toBeDisplayed();
		await expect(askRayScreen.uploadImageButton).toBeDisplayed();
		await expect(askRayScreen.takePhotoButton).toBeDisplayed();
		await expect(askRayScreen.newThreadButton).toBeDisplayed();
	});

	it('opens the conversation history and closes it again', async () => {
		await askRayScreen.openHistory();
		await expect(askRayScreen.historyIntro).toBeDisplayed();

		await askRayScreen.closeHistory();

		await expect(askRayScreen.submitButton).toBeDisplayed();
	});
});
