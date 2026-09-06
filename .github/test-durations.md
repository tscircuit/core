# Test duration baseline

`test-durations.json` records per-file milliseconds from the Bun Test run on
[core main at 63f501f](https://github.com/tscircuit/core/actions/runs/34010113573)
on September 6, 2026 (UTC), before the fanout-solver 0.0.61 update.

Each duration is the sum of Bun's reported test durations within that file's
`##[group]tests/...` log group. Failure summaries outside the groups are excluded.
For repeated file groups, retain the maximum duration. The run included a failing
progressive fanout test; its elapsed time is included because it consumed CI time.

The plan generator assigns files in descending duration order to the lightest
shard, with deterministic ties. Files without a positive recorded duration use
the median positive duration. Deleted files in the baseline are ignored.

To refresh the baseline, download a completed Bun Test run with
`gh run view RUN_ID --repo tscircuit/core --log`, aggregate the groups as above,
and update this source reference. Commit the JSON alongside the generator;
the generated `.github/test-plans/` files remain ignored.

CI supplies its matrix size through `TEST_PLAN_NODE_COUNT`. Preview the ten-shard
plans locally with `TEST_PLAN_NODE_COUNT=10 bun run generate-test-plan`.
