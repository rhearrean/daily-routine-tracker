# Daily Routine PWA Roadmap

This roadmap reflects the routine-first redesign chosen after using the app daily.

## Current release

### v12.0.4 — Routine-First Redesign

- Replace clock-based time blocks with manually ordered routines.
- Give each routine its own weekday schedule.
- Store a stable routine order and provide Move Up / Move Down controls.
- Let every routine contain an ordered checklist of steps.
- Allow duplicate step names; each step keeps a unique ID and independent status.
- Retire repeat counters; add repeated actions as separate ordered steps instead.
- Make **Complete steps in order** optional per routine.
- When order locking is enabled, completing or skipping the active step unlocks the next step.
- Allow Undo only where it cannot bypass the locked sequence.
- Complete a routine automatically when every step is completed or skipped.
- Auto-collapse completed routines while allowing manual expansion.
- Replace the Today-only time-block switch with a Today-only routine replacement, such as Office → WFH.
- Preserve Pause / Resume confirmations, snoozing, End-of-Day, skipped review, stats, recovery snapshots, backup-gated updates, and import/export.
- Keep skipped details closed until explicitly opened and use correct singular/plural step labels.
- Use compact step rows with a visible checkbox, a small Skip button, and no separate Undo button.
- Use real line breaks in Pause, Resume, and Delete confirmations.
- Allow a completed duplicate step to replace every remaining pending match in its routine for Today only.
- Restore the original step names automatically the following day.
- Migrate v11 habits, occurrences, checklist steps, history, and settings without deleting the original v11 data.
- Keep historical v11 repeat information inside the untouched legacy data and v12 backup archive.

## Superseded plan

### v11.2 — Complete in Order / Habit Locking

The useful part of this feature moved into v12.0.0 as optional locking between steps inside each routine. Separate habit-to-habit locking and time-block dependencies are no longer planned.

## Next validation work

- Test migration using the current production data backup.
- Test locked and free-order routines on iPhone.
- Test duplicate step names and step reordering.
- Test Office → WFH Today-only switching and automatic next-day reset.
- Confirm End-of-Day and Review Skipped behavior with partially skipped routines.
- Confirm legacy v11 backup import and v12 backup restore.

## Future major milestone

### Household accounts and sharing

- Separate accounts for the user and spouse.
- Private and shared routines.
- Share an entire routine or selected household tasks.
- Support household completion and individual completion.
- Add secure cloud synchronization while keeping offline PWA behavior.

## Deferred ideas

- Optional step timer
- Weekly tasks beyond selected weekdays
- One-time tasks
- Additional automatic backup/export convenience
- Expanded statistics while keeping the interface simple

Deferred items remain unnumbered until v12.0.0 is validated through normal daily use.
