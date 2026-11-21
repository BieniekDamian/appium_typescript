# Appium TypeScript

Mobile E2E tests for the **Android app under test**: WebdriverIO 10 + TypeScript + Mocha on Appium 3 (UiAutomator2), Windows 11, local Android emulator.

## What the app is

The app is **not native code**. It's a **Natively WebView wrapper** around the Next.js web app in the separate web app repo (local path: `CLAUDE.local.md`, not committed), so every screen is one WebView with the web page inside.

| Package | Build | Web origin |
|---|---|---|
| `APP_PACKAGE` in `.env` | production (Google Play) | `APP_WEB_HOST` in `.env` |
| package id of the preview build | preview | the preview web host |

The installed store build has **WebView debugging off**, so Appium only gets the `NATIVE_APP` context. Elements are found through Android's accessibility tree, which Chrome fills from the page. A debuggable build (WEBVIEW context, `data-testid`) hasn't been obtained yet.

## Commands

```bash
npm test              # all specs in tests/
npm run test:smoke    # app launches + WebView availability check
npm run timing        # where the last run spent its time (sums logs/appium.log by Appium command)
npm run dump          # save what Appium sees on the CURRENT screen → artifacts/screen.xml/.png
npm run emulator:stop    # adb emu kill (does nothing if no emulator runs)
npm run emulator:restart # stop, wait 5 s, start again (keeps its terminal busy)
npm run typecheck     # tsc --noEmit; run after every code change
npm run lint          # Biome: lint + format check (missing await, .only/.skip, unused imports, style)
npm run lint:fix      # apply Biome's safe fixes (import order, formatting)
npm run verify        # typecheck + lint; run before saying something works
npm run emulator      # start the emulator (= emulator -avd Pixel_9; keeps its terminal busy; use another one)
adb devices           # must list emulator-5554 as "device" before running tests
```

WebdriverIO starts and stops Appium itself (`@wdio/appium-service`), so don't run `appium` separately. Appium log: `logs/appium.log`. Failure screenshots: `artifacts/<suite> - <test>.png`.

## Layout

```
config/wdio.android.conf.ts  capabilities, appium service, before hook (grants notifications), failure screenshots
src/screens/base.screen.ts   locator helpers, the only place locator strategies are defined
src/screens/*.ts             one screen object per screen, exported as a singleton (homeScreen, navBar...)
src/utils/context.ts         NATIVE_APP <-> WEBVIEW switching
tests/*.spec.ts              specs, which talk only to screen objects
tools/dump-screen.spec.ts    `npm run dump` helper, not a test
```

## Locator rules

How web attributes show up in the native tree, in order of preference:

1. HTML `id` → `resource-id` → `this.byHtmlId('home-recs-heading')` (most stable)
2. `aria-label` / accessible name → `content-desc` → `this.byA11y('Go to profile')`
3. Visible text → `text` → `this.byText('Library sections')`. Some `aria-label`s also land in `text`, so check the dump.

- **The same `aria-label` can land in `text` OR in `content-desc`**, and this changed between sessions (2026-11-11 → 11-12, after an emulator restart; cause unknown, maybe a WebView update). Icon-only buttons and tabs (`Go back`, `Close search`, `Notifications`, `Save`...) are `content-desc` → `byA11y`; visible copy (headings, `Trailer`, `Synopsis`, suggestion rows) is `text` → `byText`. If many locators start failing at once, re-dump and re-check the attribute before touching test logic.
- **Some labelled containers lost their label** and have no locator now: the Share button on a title page (only an unstable `radix-_r_*` id), the "In your library" radio group, Library's "sections"/"type" groups. Don't use generated ids; suggest adding a stable `aria-label`/`id` in the web app repo.
- `click()` does **not** wait for the element to exist, and after the page changes the WebView tree can keep the old state (even 15 s) until something refreshes it. For "disappears" or "appears, then click" use `waitUntilTree()` in `BaseScreen` (it calls `getPageSource()` on every poll). Methods that change state (`close()`, `clear()`) wait for their result themselves.
- `data-testid` is **not** visible in the native tree. `byTestId()` only works in the WEBVIEW context.
- Text depends on the app language (EN/PL). Keep all strings inside screen objects, never in specs.
- No XPath and no index-based or bounds-based locators.
- Always confirm an attribute in `artifacts/screen.xml` before using it. Don't guess from the web source.
- To find stable ids and labels, search the web app: `grep -rn 'id="home-' <web-repo>/app` (`<web-repo>` = the local checkout, see `CLAUDE.local.md`).

## Test rules

- **After navigating, wait for an element of the NEW screen.** Content of the previous page can stay in the WebView's accessibility tree after it's hidden, so "old element disappeared" is not a reliable signal.
- Each screen object has a `waitForLoaded()`. Specs call it in `beforeEach` or after navigation.
- No `driver.pause()` in specs. Use `waitForDisplayed`, `waitUntil` or `expect(...).toBeDisplayed()`.
- Specs must be independent and start from a known screen (e.g. `navBar.open('Home')` in `beforeEach`).
- Tests run against a **real logged-in account**. Don't write tests that delete data or change account settings without asking the user.
- Run `npm run verify` (typecheck + Biome lint) and the affected spec before saying something works.
- **Linter:** Biome, not ESLint, because TypeScript 7 has no JS compiler API and `typescript-eslint` can't run on it. Config in `biome.json`. Biome can't see WebdriverIO types, so it catches a missing `await` only on our own async methods (`searchScreen.open()`), **not** on WDIO calls (`el.isDisplayed()`, `el.click()`): check those by hand.

## Environment facts

- **Login:** Google sign-in is done manually once; tests never automate it. `appium:noReset: true` keeps the session. To restore a logged-in state, run `adb emu avd snapshot load <logged-in-snapshot>`.
- **Notifications:** the `before` hook grants `POST_NOTIFICATIONS`, which suppresses both the OS dialog and the app's own push sheet.
- **Emulator `Pixel_9`:** API 36 with Google Play, `hw.ramSize=4096`, `hw.gpu.mode=host` (GTX 1650). With 2 GB RAM or SwiftShader rendering the app lags and hits ANRs.
- **Git Bash + adb:** set `MSYS_NO_PATHCONV=1` before `adb shell` commands with `/sdcard/...` paths, otherwise Git Bash rewrites them into Windows paths.
- Don't read credential or session files (auth state, tokens) in the web app repo.

## Skills

- `add-screen-test`: automate a new screen or flow (dump → screen object → spec → run).
- `debug-test-failure`: a test fails or a session won't start.
- `emulator-doctor`: the emulator is slow, crashing, offline, or shows "isn't responding".
- `run-tests`: run smoke, then the full scope in the background, and report with failures triaged.
- `measure-test-speed`: find where run time goes (`npm run timing`) and A/B a speed-up fairly.

## Agents

- `test-runner` (`.claude/agents/test-runner.md`): runs smoke + full scope and returns a short verdict; keeps the long run out of the main conversation. Never edits code.
- `spec-reviewer` (`.claude/agents/spec-reviewer.md`): read-only review of specs, screen objects and flows against the Locator rules and Test rules above. Use it after writing or changing tests.

## User

The user is new to Appium (Polish speaker; reply in Polish). They have written Playwright + TypeScript tests before, but often didn't fully understand what the code did. Their goal is to learn a **programmer's way of thinking**, not just to get working tests. For system-level changes (installs, PATH, AVD config) give exact steps and let them run them; project code edits are fine to make directly.

### Teaching mode (always on)

Whenever you write or change test code (screen objects, specs, helpers, config), explain it afterwards:

- **Walk through the logic line by line** where it isn't trivial: what each function does, what goes in, what comes out, and **why** it's written this way rather than another way.
- **Name every programming concept the first time it appears**, in one or two sentences with a small example: `async`/`await` and Promises (why every Appium call needs `await`), loops (`for`/`for...of`/`while`, `forEach` vs `for...of` with `await`), `waitUntil` polling, classes and singletons, `getter`s, generics, arrow functions, destructuring, `try/catch`, Mocha hooks (`before`/`beforeEach`/`it`), etc.
- **Explain the Appium-specific parts**: what a session, capability, driver, context and locator strategy are; what really happens on the wire (WebdriverIO → Appium server → UiAutomator2 → device).
- **Compare with Playwright** when it helps (auto-waiting vs explicit waits, `page.locator` vs `$`, browser context vs Appium session). They know Playwright, so use it as a bridge.
- **Explain design decisions**: why a locator lives in a screen object, why specs never contain strings, why we wait for an element of the new screen. Say what would break otherwise.
- **Show the flow of execution** for a test: what runs first, what happens on failure, what gets cleaned up.
- When a bug or failure happens, explain the **root cause** and how you diagnosed it, so they learn to debug on their own.
- Prefer a short concrete example over abstract theory. Don't dump all concepts at once: explain what's relevant to the code at hand, and keep it structured (short headings or bullets).
- Occasionally end with a small "try it yourself" exercise (e.g. change a locator, add an assertion, predict what happens if a line is removed), but don't force it every time.
- Don't skip the explanation for "simple" code; if the user wants it shorter they'll say so.
