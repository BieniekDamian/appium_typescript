---
name: add-screen-test
description: Automate a new screen or user flow with Appium. Captures the live screen with `npm run dump`, picks locators by the project rules, writes the screen object and spec, then runs them until they pass. Use when asked to "automate", "add a test for", "cover", or "write a test" for a screen, tab, dialog or flow of the app under test (search, save a title, onboarding, profile, Ask Ray, Library, Discover, Journal...).
---

# Add a screen test

Work in this order. Don't write locators before you have seen the live tree.

## 1. Preconditions

```bash
adb devices
```
`emulator-5554  device` must be listed. If it's missing or `offline`, use the `emulator-doctor` skill. Ask the user to start the emulator; they run it in their own terminal.

## 2. Capture every screen of the flow

For each screen in the flow:
1. Get the app onto that screen. Either ask the user to navigate there, or drive it with existing screen objects in a throwaway spec.
2. Run `npm run dump`.
3. Read the printed element list, then confirm exact attributes in `artifacts/screen.xml`:
   ```bash
   grep -oE '<[a-zA-Z.]+ [^>]*SOME_TEXT[^>]*>' artifacts/screen.xml | grep -oE '(text|content-desc|resource-id|clickable|selected|checked)="[^"]*"'
   ```
4. Look at `artifacts/screen.png` to match elements to what's visible.

A dump overwrites the previous one. Note what you need from each screen before moving on.

## 3. Choose locators (in this order)

| Seen in dump | Helper | Notes |
|---|---|---|
| `resource-id="foo"` (no `android:id/` prefix) | `this.byHtmlId('foo')` | HTML `id` from the web app. Best choice. |
| `content-desc="Foo"` | `this.byA11y('Foo')` | `aria-label` / accessible name |
| `text="Foo"` | `this.byText('Foo')` | Visible text, or an aria-label that landed in `text`. Language-dependent. |

- Elements without any of these (icon-only buttons without labels) can't be located reliably. Tell the user, and suggest adding an `aria-label` or `id` in the web app repo, giving the file and component. Find it with grep on nearby text in `<web-repo>/app` (the local checkout, see `CLAUDE.local.md`).
- Never use XPath, indexes or coordinates.
- If the same label appears twice (e.g. "Journal" in the nav bar and the Library section tabs), use a different attribute, or document which one `$()` returns (the first in tree order) and check it in the run.

## 4. Write the screen object

`src/screens/<name>.screen.ts`, following `home.screen.ts`:
- `class XScreen extends BaseScreen`, exported as a singleton `export const xScreen = new XScreen()`.
- Elements as getters, actions as `async` methods (`search(query)`, `saveTitle()`).
- **`waitForLoaded()`** waits for an element that exists only on this screen.
- All strings (labels, texts) live here, never in specs.
- Imports use the `.js` extension (`'./base.screen.js'`); the project is ESM.
- Reuse `navBar` for the bottom tabs; don't redefine them.

## 5. Write the spec

`tests/<flow>.spec.ts`, following `tests/home.spec.ts`:
- `beforeEach` brings the app to a known starting screen (`navBar.open('Home')` + `waitForLoaded()`).
- After every navigation, call the target screen's `waitForLoaded()`. Don't wait for the old screen to disappear: hidden web content can stay in the accessibility tree.
- Assert with `await expect(el).toBeDisplayed()`, `toHaveText(...)` and so on. No `driver.pause()`.
- Tests that create data (saving a title, a list, a journal entry) must undo it at the end (`after`/`afterEach`), so reruns start clean. Ask the user before any test that deletes existing data or changes account settings; it's a real account.

## 6. Run and iterate

```bash
npm run typecheck
npx wdio run ./config/wdio.android.conf.ts --spec ./tests/<flow>.spec.ts
```
On failure, look at `artifacts/<suite> - <test>.png` first. For deeper problems use the `debug-test-failure` skill. Run the spec **twice in a row**, since the second run catches state left over from the first. Finish with `npm test` so other specs still pass.

## 7. Update docs/test-coverage.md

`docs/test-coverage.md` is the record of what is automated and what is still to do. Update it in the **same change** as the test, never "later":

- **Automated:** add one row per new `it` (spec file, test name, kind: read-only / data + cleanup / device, backlog ID). Changed or removed tests: edit or delete their rows.
- **To do:** remove the backlog item the test now covers (its ID stays in the Automated rows). If the test only covers part of it, keep the item and narrow its scenario.
- New ideas, blockers and missing locators found while writing the test go into **To do** (with a new ID, a status and a note) or **Known gaps**. Statuses: ready / blocked / needs approval.
- Update the "Last updated" line: date, number of spec files, number of tests.

Before adding a test, also read this file: pick the next item from **To do**, and don't duplicate a test that already exists.

## 8. Report

Tell the user which screens and tests were added, what each test checks, any element that had no usable locator (with the suggested `aria-label`/`id` fix in the web app repo), and what changed in `docs/test-coverage.md`.
