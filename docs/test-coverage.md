# Test coverage

What is automated and what is still to do. **Keep this file in sync with `tests/`:** whenever a
test is added, changed or removed, update both sections in the same commit (see the
`add-screen-test` skill, step 7).

Last updated: 2026-11-21 · 15 spec files · 36 tests (35 run, 1 skipped on store builds)

**Kind** of a test:
- **read-only:** taps navigation only, changes nothing on the account
- **data + cleanup:** changes the real account and undoes it in `before`/`after`
- **device:** uses the phone itself (system keys, background, sensors), not only the page

---

## Automated

| Spec | Test | Kind | Backlog ID |
|---|---|---|---|
| `smoke.spec.ts` | launches the app in the foreground | read-only | — |
| `smoke.spec.ts` | exposes the WebView to Appium (skipped: the store build has WebView debugging off) | read-only | — |
| `home.spec.ts` | shows the main sections and navigation | read-only | — |
| `home.spec.ts` | goes to Library and back to Home | read-only | — |
| `search.spec.ts` | opens the search panel from Home | read-only | — |
| `search.spec.ts` | suggests a title while typing | read-only | — |
| `search.spec.ts` | clears the typed text with the X inside the field | read-only | — |
| `search.spec.ts` | closes the search panel with the X and returns to Home | read-only | — |
| `title-details.spec.ts` | shows the header with title and year | read-only | — |
| `title-details.spec.ts` | shows the trailer button and the library options | read-only | — |
| `title-details.spec.ts` | shows Ray's "Is this movie for you?" card | read-only | — |
| `title-details.spec.ts` | shows the synopsis further down the page | read-only | — |
| `title-details.spec.ts` | goes back to Home from the details page | read-only | — |
| `saved.spec.ts` | saves a film, lists it in Library → Saved, then unsaves it | data + cleanup | — |
| `finished.spec.ts` | marks a film as Watched and lists it in Library → Finished | data + cleanup | — |
| `in-progress.spec.ts` | marks season 1 of a series as watched and lists it in Library → In progress | data + cleanup | — |
| `not-for-me.spec.ts` | marks a film as Not for me and lists it in Library → Not for me | data + cleanup | — |
| `status-change.spec.ts` | moves a film from Library → Finished to Library → Not for me | data + cleanup | — |
| `device-navigation.spec.ts` | returns to the same Home screen, still signed in, after the app was in the background | device | B8 |
| `device-navigation.spec.ts` | returns to the same title page after the app was in the background | device | B8 |
| `device-navigation.spec.ts` | ignores system Back on Home (records the store build's behaviour) | device | B8 |
| `device-navigation.spec.ts` | ignores system Back on a title page (records the store build's behaviour) | device | B8 |
| `notifications.spec.ts` | opens the sheet from the bell and closes it back to Home | read-only | A1 |
| `notifications.spec.ts` | shows the same unread count on the bell and in the sheet (skipped when nothing is unread) | read-only | A1 |
| `discover.spec.ts` | switches to the Credits / Lists / Trending / Paths tab (4 tests) | read-only | A2 |
| `discover.spec.ts` | shows the trending movies and TV series rail on Trending | read-only | A2 |
| `ask-ray.spec.ts` | shows the message composer with image, camera and send controls | read-only | A4 |
| `ask-ray.spec.ts` | opens the conversation history and closes it again | read-only | A4 |
| `journal.spec.ts` | offers a new entry on the Titles tab | read-only | A5 |
| `journal.spec.ts` | offers a new list on the Lists tab | read-only | A5 |
| `profile.spec.ts` | shows the handle and the profile visibility | read-only | A9 |
| `profile.spec.ts` | opens Settings with the main sections and goes back to the profile | read-only | A9 |
| `profile.spec.ts` | goes back to Home with "Go to homepage" | read-only | A9 |

---

## To do

Status: **ready** (can be written now) · **blocked** (needs something first, see Notes) ·
**needs approval** (deletes or changes account data: ask before writing it).

### A. Read-only

| ID | Scenario | Status | Notes |
|---|---|---|---|
| A3 | Discover → Trending → open a title → its page | blocked | The list changes weekly and "take the first item" is an index-based locator (not allowed). Idea: open "See all" instead, or pick a title through search. |
| A6 | Library type filter: a film is under Movies, a series under Series | blocked | Depends on what other specs left in Library; needs its own prepared state (combine with a C-type setup and cleanup). |
| A7 | Library "N titles" counter matches the number of rows | blocked | Same as A6. |
| A8 | Library "Filters and sorting" sheet and in-library search open and close | ready | |
| A10 | Home recommendation card "Open: …" opens the title page | blocked | Same as A3: the cards change, no stable single locator. |
| A11 | Title page shows "Reception and ratings", "Before you watch" and "Who it's for" sections | ready | Check the structure only: ratings and counts change. `#reception-heading` exists. |
| A12 | Franchise link on a title page opens the next part | ready | e.g. "Do I need to see part one?" block. |
| A13 | Series page: switching seasons changes the heading and the episode list | ready | Season tabs: `Season N, rated …` labels (`byA11yStartsWith`). |
| A14 | Search: a nonsense query shows no results | ready | Dump the empty-result state first. |
| A15 | Search → tap a suggestion → title page (as its own test) | ready | Today only used as a setup step by other specs. |

### B. Device / native Android

| ID | Scenario | Status | Notes |
|---|---|---|---|
| B1 | Share on a title page opens the system share sheet; dismiss returns to the app | ready | Share now has `content-desc="Share"`. The sheet is native Android UI. System Back is ignored by the app, but may still close the system sheet: check. |
| B2 | "Watch on <service>" leaves the app; `activateApp` brings it back | ready | Must not leave the session on another app (use `ensureAppInForeground`). |
| B3 | Trailer opens a player and closes it | ready | |
| B4 | Kill and relaunch the app (`terminateApp` + `activateApp`): still signed in | ready | A cold start once crashed the app ("keeps stopping"); note it if it repeats. |
| B5 | Rotate to landscape and back: nav and title page still usable | ready | Restore portrait in `after`. |
| B6 | Offline mode shows the offline screen and recovers when the network is back | ready | Network MUST be restored in `after`. |
| B7 | Deep link opens a title page directly | ready | Find the URL scheme first. |

### C. Changes account data

| ID | Scenario | Status | Notes |
|---|---|---|---|
| C1 | Home card actions ("Save it", "I watched it", "Not for me") put the title in Library | ready | Cleanup exists: `ensureNotInList`. |
| C2 | "Undo the last step" after a status change restores the previous status | ready | Undoes itself; still clean up in `after`. |
| C3 | Rate a film "Personal top" → it appears in the profile's "Top shelf" | blocked | First check that a rating can be removed. |
| C4 | Create a list → add a title → delete the list | needs approval | Deletes data. |
| C5 | Add a journal entry → delete it | needs approval | Deletes data. |
| C6 | Ask Ray: send a suggested prompt → an answer arrives | needs approval | Creates a conversation that may not be deletable; the answer differs each time (check only that one arrived). |
| C7 | Notifications: "Mark all as read" | needs approval | Changes account state. |

### Out of scope

Sign-in and onboarding ("Finish my profile"), profile visibility and any Settings change,
"Clear all notifications" (cannot be undone), switching the app language.

---

## Known gaps in the app's accessibility

Elements with no stable locator (no `id`, no `aria-label`, only a generated `radix-…` id). Fix
them in the web app before automating anything that needs them:

- Library / Journal → Lists: the "All" filter button.
- The "In your library" radio group and Library's "sections"/"type" groups.
- The small "Is this movie for you?" card under the title page buttons (the same question also
  appears in the "Is it worth watching?" section, which has `#worth-watching`).
