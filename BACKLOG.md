# Daily Routine PWA Roadmap

This roadmap reflects the routine-first redesign chosen after using the app daily.

## Current release

### v12.3.1 — Repeat Step Name Visibility

- Keep temporary repeat names readable against the dark Today screen.
- Preserve all repeat behavior and schema 8 data.

### v12.3.0 — Repeat a Step at the Bottom

- Let selected permanent steps repeat on demand without creating permanent duplicates.
- Complete the current occurrence and append one temporary copy to the bottom of the same routine.
- Allow a temporary copy to repeat again, while normal completion or Skip ends the chain.
- Keep the routine open while its temporary copy remains pending.
- Remove temporary copies the following day and restore the normal routine.
- Preserve shared rotating substeps on temporary copies.
- Include temporary repeats in exports and automatic recovery snapshots.
- Keep schema 8 and all existing saved data intact.

### v12.2.0 — Manual Routine Start

- Let every routine choose **Start automatically** or **Wait until I start it**.
- Keep an available manual routine collapsed until **Start Routine** is pressed.
- Lock later routines until the available routine is started and resolved.
- Expand a manual routine immediately when it is started.
- Collapse a resolved routine and make the next routine available using its own start setting.
- Reset manual-start state the following day without changing schedules.
- Keep existing routines on automatic start unless explicitly changed.
- Include manual-start state in exports and automatic recovery snapshots.
- Keep schema 8 and all existing saved data intact.

### v12.1.1 — Shared Rotating Substeps

- Add an optional FIFO reminder list beneath a parent step.
- Move a tapped rotating item to the end so another room or area becomes next.
- Keep rotating substeps optional; they never block parent-step or routine completion.
- Duplicate a step with its name, weekday schedule, and shared rotation group, but not its progress.
- Let linked duplicates share one rotation order across routines.
- Offer explicit **Only This Step** or **All Exact Matches** choices for rename, rotation linking, and delete.
- Match names case-insensitively after trimming and collapsing spaces.
- Preserve completed history while cleaning pending priorities for deleted or renamed source steps.
- Include rotations in exports and automatic recovery snapshots.
- Keep schema 8 and all existing saved data intact.

### v12.0.8 — Priority Next Routine

- Let an individual skipped step be flagged as **Priority Next Time**.
- Keep the carryover inside the same routine rather than creating a separate priority routine.
- Add one temporary extra copy at the top of that routine's next scheduled occurrence.
- Preserve the routine's permanent steps, duplicate count, saved order, and weekday schedules.
- Keep the original day recorded as skipped.
- Allow multiple flagged steps and retain their original relative order.
- Remove a queued priority when its source skip is cleared or Today is reset.
- Resolve the temporary priority after it is completed or skipped; require a new flag to carry it again.
- Include priority carryovers in exports and automatic recovery snapshots.
- Keep schema 8 and all existing saved data intact.

### v12.0.7 — Step Weekday Schedules

- Let every step inherit all of its routine's scheduled days by default.
- Allow an individual step to run only on selected weekdays.
- Keep duplicate step names independently schedulable.
- Hide steps that do not run today before applying step locks and completion rules.
- Keep a routine out of Today when none of its steps run that day.
- Preserve all existing step behavior, Today-only replacements, history, and schema 8 data.
- Keep the weekday picker collapsed until a custom step schedule is selected.

### v12.0.5 — Routine-First Redesign

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
- Keep the first unresolved routine expanded while later routines remain collapsed and locked.
- Collapse a completed routine and automatically unlock and open the next routine.
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
