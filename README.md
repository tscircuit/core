Core [PR #5874](https://github.com/tscircuit/core/pull/5874) now pins the exact published consolidated solver preview `bb22465` from bus-lanes-solver [PR #249](https://github.com/tscircuit/bus-lanes-solver/pull/249). The pin is committed on Core head `8e78815a47faa8bd7a1b7470478bbe9aaec874f6`, based on main `de64aaf0859b49d43dd611cade55573bc7f7a26c`.

The old `1df038d` and new `bb22465` published tarballs have identical contents for all five files, including JavaScript, declarations and package metadata. [File hashes](package-comparison.json). No additional Core integration-code or snapshot changes were needed for the pin. The existing package conflict with current main was resolved by retaining main's updates and the preview dependencies.

A fresh normal-Core solve with the installed published package starts with empty copper and passes **53/53 connections, 9/9 hard skew checks, 6/6 preservation checks and zero physical DRC findings**. Routing plus matching share the unchanged 120-second budget; total local wall time was 45.148 seconds on macOS arm64/Bun 1.4.2. [Measurements](h616.json), [unmodified Circuit JSON](h616-circuit.json.gz), [provenance](provenance.json). Its full copper, pad and component records are identical to the preceding verified H616 output. [Comparison](h616-copper-comparison.json).

All ten Core CI test shards, typecheck, build/smoke tests, class exports and package preview pass on the final revision. The only failed check is the existing preview-dependency release guard: “Replace pkg.pr.new dependency specs with published package versions before merging.” That guard was not changed or bypassed; the PR remains a draft.

The matched local old/new integration runs each had 5 passes and 10 image comparison failures, with byte-identical difference PNGs. Inspection of the differential-pair case shows identical routes and note text; only the note font-family and nonvisual software-version metadata differ from its historical SVG. No expected snapshots were changed. The Linux CI tests pass. [Matched local comparison](paired-tests.json).

- [All ten test shards](https://github.com/tscircuit/core/actions/runs/45569460269)
- [Typecheck](https://github.com/tscircuit/core/actions/runs/45569460504)
- [Build and smoke tests](https://github.com/tscircuit/core/actions/runs/45569460225)
- [Full ten-board DDR comparison](https://github.com/tscircuit/core/actions/runs/45569469728)

The full DDR comparison uses the same pinned benchmark package and a 120-second shared routing/matching budget per board on each revision. It compares the current main revision with the final Core pin. The three deferred general unverified warnings are not suppressed or modified.
