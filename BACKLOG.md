# Daily Routine PWA Roadmap

This is the authoritative roadmap after the v10.10.x cleanup and stability phase.

## Current release

### v11.1.3 — Repeatable Habits Within a Time Block ✅

- Let one habit occurrence be completed multiple times inside the same time block.
- Keep the card available after the first completion.
- Count each completion independently per occurrence and time block.
- Support an optional target such as `3 times`.
- Reaching the target completes the occurrence for Today’s progress but does not lock it.
- Support no-target repeats and routine-step reset after each logged repeat.
- Use one log control and lock recorded repeats against Today-screen adjustments.
- Keep targeted repeats checked and disable logging after the target is reached.
- Keep longer update information scrollable and all update controls reachable on iPhone.

## Completed milestone

### v11.0.1 — End-of-Day Experience ✅

- Hide the normal Today list once every scheduled occurrence is completed or skipped.
- Show a clean “Good job! You're all done for today.” finish state.
- Acknowledge skipped habits and provide **Review Skipped**.
- Allow Today’s routine to be reopened for review or correction.
- Keep Rest Days unchanged and return to the normal Today screen the following day.
- Count only occurrences in time blocks active for that day, so hidden day-specific blocks cannot prevent completion.

## Confirmed next builds

### v11.2 — Complete in Order / Habit Locking

- Add optional sequencing within a time block.
- Unlock the next habit after the previous habit is resolved.
- Keep sequencing optional rather than applying it to every habit.
- Make habit reordering update the visible lock sequence without stale dependencies.

## Deferred backlog

- Optional Habit Timer
- Weekly Tasks
- One-Time Tasks
- More scheduling frequencies
- Pause / Resume convenience control on the Today card
- Additional automatic backup and export convenience
- Expanded statistics, while keeping the interface simple and focused on skipped items

Items in the deferred backlog do not have release numbers yet. Their order will be chosen after v11.2 based on how the app is being used.
