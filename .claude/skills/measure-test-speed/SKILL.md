---
name: measure-test-speed
description: Find where the Appium suite spends its time and check whether a speed-up really helps. Sums Appium command times from logs/appium.log (`npm run timing`) and runs a fair A/B comparison. Use when asked to speed up the tests, optimise execution time, compare two configurations, or when the suite got slower.
---

# Measure test speed

Measure first, then change. The slowest-looking thing is often not the slowest thing.

## 1. Where does the time go?

```bash
npm run timing            # reads logs/appium.log of the LAST run
```
Prints wall time and the commands sorted by total time: `POST /elements` (locator lookups), `GET /source` (full tree reads from `waitUntilTree`), `execute/sync` (scroll gestures), `POST /session` (session start), clicks.

`logs/appium.log` is overwritten by every run: copy it first to keep a run for comparison.

Reference (2026-11-15, full suite): 10:49 → 6:52 after three fixes, 17 tests:
1. `ensureNotInList` returns early when nothing needed undoing (was a second 6 s check every time).
2. `isTitleListed` stops waiting once the list has LOADED (row, "N titles" counter or "Nothing ... yet"), instead of always burning the full 6 s to say "not listed".
3. One Appium session for all specs (`specs: [[...]]`), saves ~7 s per file.
`appium:waitForIdleTimeout: 0` gave another ~9 % on three specs.

## 2. Typical time sinks in this project

- A `waitUntil` that can only succeed by timing out ("the element is NOT there"). Give it a positive signal that the page has loaded, then answer immediately.
- Repeating a check that cannot have changed.
- Many `getPageSource()` reads in tight polling loops.
- Anything that restarts the app or the session.

## 3. A/B a change fairly

1. Pick 3 specs of different kinds (e.g. `title-details`, `saved`, `search`).
2. Run **A B A B**, not A A B B: the emulator warms up and drifts, so interleaving spreads that noise over both sides.
3. Make the change switchable without editing code (an env var in the config, like `WAIT_FOR_IDLE`), so both arms use identical code.
4. After each run copy `logs/appium.log`, then compare `npm run timing -- <copy>`; confirm in the log that the setting reached the session (`grep -m1 -o 'waitForIdleTimeout":[0-9]*' logs/appium.log`).
5. Trust a difference only if it repeats in both pairs and the gain sits in the commands the theory predicts.
6. Finish with one full run: the full suite must stay green.

## 4. What NOT to do

- Don't cut timeouts or polling intervals blindly: a flaky suite is slower than a slow one (a failure costs a re-run).
- Don't replace a state check with a pause. Waiting for the end state (button label, row on a list) is both faster and stabler than waiting for a toast that may vanish.
- Parallel runs need a second emulator AND separate test data per spec on the same account; 4 GB RAM per emulator is tight on this 14 GB machine. Propose it, don't set it up unasked: emulator installs are the user's to run.
