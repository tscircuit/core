# CI test timing maintenance

`generate-test-plan.ts` assigns every `tests/**/*.test.{ts,tsx}` file exactly once,
using longest-processing-time-first scheduling across the configured node count.
`.github/test-timings.json` contains average per-file milliseconds from two
successful Ubuntu CI runs:

- https://github.com/tscircuit/core/actions/runs/36665186048
- https://github.com/tscircuit/core/actions/runs/36664433096

These measure test bodies (including snapshot assertions), not installation or
module loading. New/unmeasured files receive the suite's mean measured file time.
Plans are deterministic and deleted/renamed files are ignored during discovery.

The first run's old shards ranged from 83 to 445 seconds. Replaying its measured
file times with the new assignment gives a longest shard of approximately 246
seconds. This is an estimate; runner speed, module loading and test interactions
can change actual times. The three longest files each occupy their own shard.

## Slow tests to investigate

| File under `tests/repros/` | Mean seconds | Range across the two runs |
| --- | ---: | ---: |
| `repro-am62l-lpddr4-orbit-south.test.tsx` | 214.1 | 182.4–245.9 |
| `repro-am62l-lpddr4-orbit-north.test.tsx` | 209.7 | 184.7–234.6 |
| `repro-am62l-lpddr4-orbit-west.test.tsx` | 198.6 | 164.3–232.9 |
| `repro-am62l-direct-decoupling-fanout.test.tsx` | 153.4 | 153.2–153.7 |
| `repro-sii9022-hdmi-fanout-handoff.test.tsx` | 121.2 | 107.5–134.9 |
| `repro159-matchpack-led-matrix-iterations.test.tsx` | 31.0 | 26.0–36.0 |

The first five account for approximately 51% of all measured test time. The
orbit tests render full AM62L/LPDDR4 BGA boards through `renderUntilSettled()`;
the direct-decoupling test includes the real power/decoupling network; the HDMI
test runs the fanout-to-differential-pair routing handoff. These are substantial
solver regressions with visual coverage. This change preserves that coverage.
Profiling render/solver phases is needed before attributing the time to a
particular algorithm or reducing the workload safely.

The orbit tests explicitly allow 600 seconds, direct decoupling allows 900, and
HDMI allows 300. Those per-test limits override CI's `--timeout 30000`; it is not
a universal 30-second ceiling.

## Refreshing the baseline

Every shard writes its slowest 20 files to the Actions job summary and uploads
`test-timings-nodeN` artifacts, including separate logs for native-crash retries.
Download logs from a successful full run and refresh the checked-in baseline:

```sh
bun run scripts/report-test-times.ts --update /path/to/logs/node*-attempt1.log
TEST_PLAN_NODE_COUNT=10 bun run scripts/generate-test-plan.ts
```

Use completed successful attempts when refreshing; incomplete attempts can
underestimate file time. Pass logs from multiple runs to average observations.
The update preserves older measurements for unobserved existing files and
removes deleted files. Review and commit `.github/test-timings.json` when the
suite's workload changes. Baselines are checked in so all matrix jobs use the
same measurements without cache misses or races.

The reporter also accepts `gh run view RUN_ID --log` output. It sums multiple
test cases within each file and handles GitHub log prefixes and ANSI colors.
