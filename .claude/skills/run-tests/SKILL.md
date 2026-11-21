---
name: run-tests
description: Run the Appium suite the way this project needs it: check the emulator, smoke first, then the full scope in the background, then a short verdict with every failure triaged against known causes. Use when asked to "run the tests", "uruchom testy", "puść smoke / cały scope", "check that everything passes", or after a code change that needs the whole suite as proof.
---

# Run the tests

The full suite takes ~7 min and runs in ONE Appium session (all specs in one worker, see `specs: [[...]]` in the config). It uses a real logged-in account.

## 1. Preconditions

```bash
adb devices
```
`emulator-5554  device` must be listed. Missing or `offline` → `emulator-doctor` skill; the user starts the emulator in their own terminal.

## 2. Smoke first

```bash
npm run test:smoke
```
If it fails, **do not start the full run**: every other spec would fail for the same reason. Look at the failure screenshot (`artifacts/Smoke_ app under test - <test>.png`) before anything else.

Known causes:
- **"<app> keeps stopping" dialog in the screenshot.** The app crashed on cold start (`adb logcat -b crash -d` shows `ClassNotFoundException ... AudioService`). Seen 2026-11-21 after days of the emulator being idle; the next launch worked. Re-run smoke once. A second crash in a row is not a test problem: report it, don't "fix" the spec.
- Other failures → `debug-test-failure` skill.

## 3. Full scope, in the background

```bash
npm test 2>&1 | grep -E "» tests|✓|✖|passing|failing|Spec Files|Error"
```
Run it with `run_in_background` (it exceeds the 10 min foreground limit on a slow day) and read the output file when the completion notification arrives. Don't poll, and never start a second copy: two sessions fight over one emulator and one account.

## 4. Report

- One line per spec file is enough; give counts (`17 passing`) and the wall time from the last line.
- For every `✖`: the error text, the screenshot (`artifacts/<suite> - <test>.png`, read it) and the likely cause via `debug-test-failure`. A failing test that passes alone (`--spec ./tests/x.spec.ts`) usually means the PREVIOUS spec left the app in a state (all specs share a session now); say which spec ran before it.
- If something passed only after a retry, say so. Don't report "all green" for a run that needed a second attempt.

## Notes

- Test data is real: specs that change Library state clean up in `before`/`after`. If a run was killed halfway, the account may hold leftovers (`Inception`, `Interstellar`, `Avatar`, `Shrek`, `Game of Thrones` in Saved / Finished / Not for me / In progress); the next run's `before` clears them.
- `WAIT_FOR_IDLE=10000 npm test` restores UiAutomator2's old idle wait (the default is 0). Use it to check whether a flaky test is caused by the faster setting.
