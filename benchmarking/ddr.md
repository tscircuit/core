# DDR workflow benchmark

Run `bun run benchmark:ddr` from the core checkout after `bun install`.
This uses the benchmark repository revision pinned in package.json and renders
ten native DDR TSX circuits through this checkout's RootCircuit. It measures
the bus-lane phases, local routing of remaining nets, connectivity, physical
checks, render time, and render-process peak RSS. No benchmark runs on pushes,
pull request updates, or the normal test/build jobs.

Examples:

```sh
bun run benchmark:ddr --circuit h3 --timeout 120 --out /tmp/ddr-h3
bun run benchmark:ddr --geometry-only --out /tmp/ddr-geometry
```

Results include report.md, results.json, per-phase SRJ inputs/outputs, partial
Circuit JSON, solver event metadata, logs, and check findings. Each circuit has
a fresh process and a hard external render timeout. Validation runs separately;
timeouts retain completed copper and are reported as timeouts. Failed solver
cases are benchmark outcomes; infrastructure or validation crashes fail the
command. A pass requires full connectivity, clean routing checks and a native
pad geometry audit. Timing and impedance are outside this benchmark's scope.

After the workflow is merged into the default branch, an owner, member or
collaborator may comment on a PR:

```text
/benchmark
/benchmark --circuit h3 --timeout 120
```

The workflow snapshots the PR base and head, runs both sequentially on one
Blacksmith runner using the same trusted pinned benchmark revision, and posts
the comparison in a PR comment. It also supports manual workflow dispatch with
a PR number. PR comment timeouts accept 1–300 seconds per circuit. The job executing PR code has read-only permissions; a separate
job posts results without executing PR source. `BENCHMARK_RUNNER` can override
the default runner. Normal CI never invokes the benchmark.
