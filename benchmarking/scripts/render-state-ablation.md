# Isolating the render-state optimization

The original PR comparison bundled compact phase state, fewer temporary async
arrays, a cheaper isolated-phase guard, and a lifecycle-listener hint. Counting
allocations alone does not prove which change improves rendering latency.

This follow-up compares four combinations on the same frozen AM62A source from
`compact-render-state.md`. Each combination gets five fresh Node 26.4.0 processes;
order rotates each round. The built baseline/PR Renderable implementations are
combined to retain original or optimized storage independently of per-phase
lifecycle, async-check, and traversal work. Dependencies, eval configuration,
application compatibility patches and source input stay fixed. No browser cache,
CPU profiler, or per-component lifecycle listener runs in the timed samples.

## Isolated contributions

| Variant | Evaluation median | Peak RSS median |
| --- | ---: | ---: |
| Merged #4093 baseline | 5.868 s | 1,019 MiB |
| Simpler loop/lifecycle changes, original state | 5.650 s | 1,037 MiB |
| Compact state, original loop/lifecycle work | 4.951 s | 788 MiB |
| Both (original #4094 implementation) | 4.384 s | 762 MiB |

Compact state alone saves **0.917 s (15.6%)** at the median and about **231 MiB
(22.6%)** of peak process memory. The simpler changes alone save about 3.7%; the
combined result improves 25.3%. These effects are not strictly additive.

This is a meaningful incremental improvement, not an explanation for all the
remaining runtime. It isolates the storage design's allocation, lookup and GC
costs together; it does **not** show that construction allocations alone consumed
0.9 seconds. Most of the observed difference is in render/settle time (4.827 →
3.927 s), rather than eval execution (1.008 → 0.955 s).

Absolute timings vary. Compact-only samples range from 4.418 to 6.358 seconds,
including one slower sample than baseline; baseline samples range from 5.710 to
5.948 seconds. All samples are retained, including the outlier. These are local
measurements of this large imported board, not a guarantee for every circuit or
host.

## Keeping the implementation readable

All renderer writes to the compact flags/public state view now pass through one
private helper. The render loop no longer repeats the compatibility bookkeeping
five times. The helper keeps an existing observed state reference when a handler
replaces its public entry, while also supporting first-time inspection inside a
handler. A regression test covers entry replacement.

A separate three-pair comparison measured the cleanup at **4.677 s** versus
**4.578 s** for the original implementation: about 0.1 seconds (2.2%) slower in
that batch. This is an explicit readability tradeoff rather than a new speedup.

A final fresh three-pair comparison of baseline against the cleaned code measured
**5.158 → 3.754 seconds** median and **1,033 → 781 MiB** peak RSS. Compare timings
within each batch, rather than treating differences between batches as additional
improvements. The real-board 2-second target remains unmet.

All **32** full-board renders across these comparisons produce the same 66,219
records with no error or pour records. The normalized output hash is
`ab07dad4dab9537a53d5ccaed1b804d4e9a9401812a6efafdae4885b92072b54`.
Only the software-version label is normalized. See
`render-state-ablation-results.json` for ordered samples, stage timings, memory
figures and the shared record inventory. Peak RSS uses Node's `maxRSS` in KiB;
render timers exclude process/module startup, serialization, transfer and viewer
rendering as in the original benchmark.
