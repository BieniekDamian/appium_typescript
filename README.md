# Appium TypeScript tests

Mobile E2E tests for the Android app under test, written in WebdriverIO + TypeScript + Mocha on Appium 3 (UiAutomator2).

The app under test is a **Natively WebView wrapper** around the web app in the web app repo. Most of the screen is one WebView, so tests switch into the `WEBVIEW` context and use the web app's existing `data-testid` attributes.

| Package | Build |
|---|---|
| `APP_PACKAGE` in `.env` | production build |
| package id of the preview build | preview build (point `APP_PACKAGE` at it) |

## Run

1. Start the emulator: `emulator -avd Pixel_9`, then check that `adb devices` lists it.
2. Install the app on it (Google Play, or `adb install path\to\app.apk`).
3. `copy .env.example .env` and set `APP_PACKAGE` (the app's Android package id) and `APP_WEB_HOST` (its web host).
4. `npm run test:smoke`

You don't need to start `appium` yourself: WebdriverIO starts and stops it (`@wdio/appium-service`). Appium's log is written to `logs/appium.log`, and screenshots of failed tests go to `artifacts/`.

## Finding locators

Leave the app on the screen you want to automate and run `npm run dump`. It writes `artifacts/screen.xml` and `artifacts/screen.png`, and prints every element that has text, a `content-desc` (from `aria-label`) or a `resource-id` (from the HTML `id`). See `src/screens/base.screen.ts` for which locator to use for each.

## Layout

```
config/   wdio.android.conf.ts   capabilities, Appium service, hooks
src/      screens/               screen objects (Page Object Model)
          utils/context.ts       NATIVE_APP <-> WEBVIEW switching
tests/    *.spec.ts              test specs
tools/    dump-screen.spec.ts    `npm run dump` helper (not a test)
```

## Login (Google)

Tests don't automate Google sign-in. Google blocks automated logins (captchas, "this browser may not be secure"), and the Playwright suite in the web app repo works the same way: log in by hand once and reuse the session.

1. Open the app on the emulator and sign in with the **test** Google account.
2. Save an emulator snapshot of the logged-in state:
   `adb emu avd snapshot save <logged-in-snapshot>`
3. Tests keep app data between runs (`appium:noReset: true`), so they start logged in.
4. If the session expires or the emulator gets messy, go back to the snapshot:
   `adb emu avd snapshot load <logged-in-snapshot>`

## Notifications popup

`config/wdio.android.conf.ts` grants `POST_NOTIFICATIONS` before each session (`before` hook), so neither the Android dialog nor the app's own "enable notifications" sheet gets in the way.

## WebView access

Appium can only enter the WebView if the build has WebView debugging enabled. To check, open the app on the emulator and go to `chrome://inspect/#devices` in desktop Chrome. If the app's page is listed there, Appium can use it. If not, ask for a debuggable build from Natively, or the tests have to use the native accessibility tree (visible text and `aria-label`s) instead of `data-testid`.
