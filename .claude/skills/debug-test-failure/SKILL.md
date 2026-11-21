---
name: debug-test-failure
description: Diagnose a failing Appium test or a session that won't start. Reads the failure screenshot, Appium log and device crash/ANR logs, and matches them against known causes in this project. Use when a spec fails, is flaky, times out, "element not found", "still displayed", "Failed to create a session", or the user pastes a failing wdio/Appium output.
---

# Debug a test failure

Collect evidence first, then match it to a known cause. Don't change a locator or timeout before you know why it failed.

## 1. Collect evidence

1. **The error text** from the wdio output (the user's paste or your own run).
2. **Failure screenshot:** `artifacts/<suite> - <test>.png`. Read it. It shows what was actually on screen.
3. **Device state:**
   ```bash
   export MSYS_NO_PATHCONV=1
   adb devices
   adb shell dumpsys activity activities | grep -m1 topResumedActivity
   adb logcat -b crash -d -t 100
   adb logcat -d | grep -E "ANR in|Reason:" | tail -5
   ```
4. **Appium log:** `logs/appium.log`. Search for `error` near the end.
5. **The live tree, if the app is still on the failing screen:** `npm run dump`, then check whether the locator's attribute really exists in `artifacts/screen.xml`.

## 2. Known causes

| Symptom | Cause | Fix |
|---|---|---|
| `Unable to resolve the launchable activity of '<package>...'` | App not installed on this emulator (or wrong `APP_PACKAGE` in `.env`) | `adb shell pm list packages \| grep <package>`; install from Play Store, or set the right package |
| `Failed to create a session`, `device offline` / no devices | Emulator not running or still booting | `adb devices`; ask the user to start `emulator -avd Pixel_9` and wait for the home screen |
| `element (...) still displayed` after navigating away | Hidden web content stays in the WebView accessibility tree | Wait for the **new** screen's `waitForLoaded()` instead of the old element disappearing |
| `element (...) not displayed/not existing` but the screenshot shows it | Locator attribute is wrong (e.g. aria-label landed in `text`, not `content-desc`) | Dump, check the attribute in `screen.xml`, switch between `byA11y`/`byText`/`byHtmlId` |
| Screenshot shows a login / onboarding screen | Session expired or app data was reset | Ask the user to log in again, or `adb emu avd snapshot load <logged-in-snapshot>` |
| Screenshot shows PL texts | App language switched to Polish | Text locators are EN; switch the app back to EN, or add the PL variant inside the screen object |
| Screenshot shows "<app> isn't responding" | ANR, usually emulator under-resourced | Use the `emulator-doctor` skill |
| Notifications dialog or "enable notifications" sheet over the screen | Permission not granted (new emulator/app data) | Check the `before` hook in `config/wdio.android.conf.ts` ran; `adb shell pm grant <package> android.permission.POST_NOTIFICATIONS` |
| `strict mode violation ... resolved to 2 elements` for `~Home` or a toggle, right after opening a title from Library | The title page is drawn over Library; both are in the tree (see CLAUDE.md) | Anchor the locator to a neighbour only that page has; go back with the page's Back before touching the nav bar |
| Works alone, fails in `npm test` | State left by another spec (screen, saved data) | Make `beforeEach` reset to a known screen; clean up created data |
| Slow, random timeouts | Software rendering or low RAM | `emulator-doctor` skill |
| `No WEBVIEW context` | Store build has WebView debugging off. Expected, not a bug | Native-tree locators only (see CLAUDE.md) |

## 3. Fix and confirm

- Fix the cause in the screen object (locators, `waitForLoaded`) rather than adding `pause()` or bigger timeouts in the spec.
- Rerun the single spec twice, then `npm test`.
- If it's a flaky failure you can't reproduce, say so plainly and report what the evidence showed. Don't claim it's fixed.

## 4. Report

Tell the user: what failed, the evidence (screenshot or log line), the cause, what you changed, and the rerun result.
