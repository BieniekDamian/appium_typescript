import type { ChainablePromiseElement } from 'webdriverio';

/**
 * Base class for screen objects (the mobile version of the Page Object Model).
 *
 * The current (store) build of the app does not let Appium into the WebView, so
 * screens are located through Android's accessibility tree, which Chrome fills
 * from the web page:
 *   - aria-label / accessible name -> content-desc  -> byA11y()
 *   - HTML id attribute            -> resource-id   -> byHtmlId()
 *   - visible text                 -> text          -> byText()
 * Preference: byHtmlId > byA11y > byText. Text locators depend on the app
 * language (EN/PL), so keep them inside screen objects, never in tests.
 *
 * `data-testid` is NOT visible in this tree. It becomes usable through
 * byTestId() once a build with WebView debugging is available (see README).
 */
export abstract class BaseScreen {
	protected byA11y(label: string) {
		return $(`~${label}`);
	}

	protected byHtmlId(id: string) {
		return $(`android=new UiSelector().resourceId("${id}")`);
	}

	protected byText(text: string) {
		return $(`android=new UiSelector().text("${text}")`);
	}

	/**
	 * Visible text, but only on a <button>. Use it when the same text also appears as a
	 * heading or paragraph (e.g. "Is it for me?" is both): `.className()` narrows the
	 * match so `$()` doesn't return the first element in tree order.
	 */
	protected byButton(text: string) {
		return $(`android=new UiSelector().className("android.widget.Button").text("${text}")`);
	}

	/**
	 * A button whose text STARTS WITH the prefix. For buttons that pack a title and a description
	 * into one label, e.g. Settings' "Account Name, birthday, e-mail and sign-in".
	 */
	protected byButtonStartsWith(prefix: string) {
		return $(`android=new UiSelector().className("android.widget.Button").textStartsWith("${prefix}")`);
	}

	/**
	 * A toggle found NEXT TO another toggle (same parent): `fromParent` searches the anchor's siblings.
	 * For a label that exists twice in the tree with identical attributes, where only the neighbour
	 * tells them apart. E.g. a title page opened from Library is drawn ON TOP of Library, so the tree
	 * holds Library's "Not for me" filter chip AND the page's "Not for me" button; only the page's one
	 * sits beside "Watched".
	 */
	protected byToggleBeside(anchorText: string, text: string) {
		const toggle = 'new UiSelector().className("android.widget.ToggleButton")';
		return $(`android=${toggle}.text("${anchorText}").fromParent(${toggle}.text("${text}"))`);
	}

	/**
	 * A toggle (on/off) button by its text, e.g. the "Watched" button or a Library filter chip.
	 * It exposes its state as the `checked` attribute, so tests can read it. Narrowed by class
	 * because the same word also appears in plain text ("Watched." / "It's in Watched...").
	 */
	protected byToggle(text: string) {
		return $(`android=new UiSelector().className("android.widget.ToggleButton").text("${text}")`);
	}

	/**
	 * A checkbox by its text, e.g. "Saved Your library" in the "Where to save?" sheet. Like the
	 * toggles, its `checked` attribute stays "false" in the tree, so read the result elsewhere.
	 */
	protected byCheckBox(text: string) {
		return $(`android=new UiSelector().className("android.widget.CheckBox").text("${text}")`);
	}

	/**
	 * Plain text INSIDE a parent element. For copy repeated in several sections of one page:
	 * `parent.$()` searches only the parent's subtree, so the section decides which copy we get.
	 */
	protected byTextViewIn(parent: ChainablePromiseElement, text: string) {
		return parent.$(`android=new UiSelector().className("android.widget.TextView").text("${text}")`);
	}

	/** A button by its text INSIDE a parent element (see byTextViewIn). */
	protected byButtonIn(parent: ChainablePromiseElement, text: string) {
		return parent.$(`android=new UiSelector().className("android.widget.Button").text("${text}")`);
	}

	/** Visible text, but only in plain text (not a button). Counterpart of byButton for the same-text case. */
	protected byTextView(text: string) {
		return $(`android=new UiSelector().className("android.widget.TextView").text("${text}")`);
	}

	/**
	 * Accessible name (content-desc) that STARTS WITH the prefix. For labels with a changing tail,
	 * e.g. "Season 1, rated 8.4 out of 10": the rating moves, "Season 1," does not.
	 */
	protected byA11yStartsWith(prefix: string) {
		return $(`android=new UiSelector().descriptionStartsWith("${prefix}")`);
	}

	/**
	 * Like byA11yStartsWith, but only a CLICKABLE element. For a card whose accessible name starts
	 * with the same words as a child's (card "Avatar backdrop Avatar 2009 ..." vs its image "Avatar
	 * backdrop"): the card is the one you tap.
	 */
	protected byClickableA11yStartsWith(prefix: string) {
		return $(`android=new UiSelector().descriptionStartsWith("${prefix}").clickable(true)`);
	}

	/** Visible text matching a Java regular expression (UiSelector.textMatches). */
	protected byTextMatches(regex: string) {
		return $(`android=new UiSelector().textMatches("${regex}")`);
	}

	/** Visible text that CONTAINS the fragment. For long, copy-heavy text we don't want to paste whole. */
	protected byTextContains(fragment: string) {
		return $(`android=new UiSelector().textContains("${fragment}")`);
	}

	/**
	 * Native Android class name, e.g. 'android.widget.EditText'. Use it only when the
	 * element has no id / label / stable text (a text field shows its typed value as
	 * `text`, so byText would break the moment the value changes) AND the class is
	 * unique on the screen. Otherwise `$()` silently returns the first match.
	 */
	protected byClass(className: string) {
		return $(`android=new UiSelector().className("${className}")`);
	}

	/**
	 * Polls `condition` until it is true, forcing a fresh read of the accessibility tree before each
	 * check. Use it when the page has just changed (an element should DISAPPEAR, or APPEAR before a
	 * `click()`, which does not wait): the WebView's tree can keep reporting the old state, sometimes
	 * for 15 s, until `getPageSource()` refreshes it. Plain `waitForDisplayed()` is fine for slow loads.
	 */
	protected async waitUntilTree(condition: () => Promise<boolean>, timeoutMsg: string): Promise<void> {
		await driver.waitUntil(
			async () => {
				await driver.getPageSource();
				return condition();
			},
			{ timeout: 15_000, interval: 1_000, timeoutMsg },
		);
	}

	/**
	 * Scrolls the page content down by one swipe in the middle of the screen.
	 * Elements below the fold are not displayed, and click() on them hits whatever is on top
	 * of that spot (we once tapped the bottom nav bar this way).
	 *
	 * The swipe area comes from the window size, not from an element: the page container
	 * (id "tresc") disappears from the tree while a dialog is mounted, so it can't be relied on.
	 * This is a gesture area, not a locator: it never decides WHICH element we act on.
	 */
	protected async scrollPageDown(): Promise<void> {
		const { width, height } = await driver.getWindowSize();
		await driver.execute('mobile: scrollGesture', {
			left: Math.round(width * 0.1),
			top: Math.round(height * 0.3),
			width: Math.round(width * 0.8),
			height: Math.round(height * 0.4),
			direction: 'down',
			percent: 0.8,
		});
	}

	/**
	 * Scrolls down until the element is comfortably on screen (at most `maxScrolls` swipes).
	 * "Displayed" alone is not enough: an element peeking out just above the bottom nav bar
	 * counts as displayed, but a click on its centre lands on the nav bar. So we also want its
	 * bottom edge in the upper 3/4 of the screen. Position is used only to decide whether to
	 * scroll more, never to find or click an element.
	 */
	protected async scrollUntilDisplayed(element: ChainablePromiseElement, maxScrolls = 8): Promise<void> {
		const { height: screenHeight } = await driver.getWindowSize();
		const isComfortablyVisible = async (): Promise<boolean> => {
			if (!(await element.isDisplayed())) return false;
			const { y } = await element.getLocation();
			const { height } = await element.getSize();
			return y + height < screenHeight * 0.75;
		};
		for (let i = 0; i < maxScrolls && !(await isComfortablyVisible()); i++) {
			await this.scrollPageDown();
			await driver.getPageSource();
		}
		await element.waitForDisplayed({ timeout: 5_000 });
	}

	/**
	 * Taps `element` until `succeeded()` becomes true: up to `attempts` taps, each followed by
	 * ~8 s of polling (with fresh tree reads). A tap made while the page is still hydrating is
	 * silently ignored, so a single click() is not enough for state-changing buttons.
	 * It re-taps ONLY when nothing happened, so a slow-but-successful tap is not undone.
	 */
	protected async tapUntil(
		element: ChainablePromiseElement,
		succeeded: () => Promise<boolean>,
		errorMsg: string,
		attempts = 3,
	): Promise<void> {
		for (let attempt = 1; attempt <= attempts; attempt++) {
			await element.click();
			try {
				await driver.waitUntil(
					async () => {
						await driver.getPageSource();
						return succeeded();
					},
					{ timeout: 8_000, interval: 1_000 },
				);
				return;
			} catch {
				// nothing happened: try again
			}
		}
		throw new Error(`${errorMsg} (after ${attempts} taps)`);
	}

	/** WEBVIEW context only (debuggable builds). */
	protected byTestId(testId: string) {
		return $(`[data-testid="${testId}"]`);
	}
}
