# Agent Instructions

- Do not modify files under `schedule/` unless the user explicitly asks to edit schedule source data.
- In particular, never rewrite `schedule/fifa_world_cup_2026_schedule_nl.md` to "fix" dates, weekdays, times, teams, groups, venues, or stages.
- Treat the schedule markdown as authoritative input. If the app cannot find or display a match as expected, fix parser, filtering, timezone, or UI logic instead of changing the markdown data.
