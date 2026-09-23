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

At `cb7f2b4`, renderer writes to the compact flags/public state view passed through one
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

## Intermediate implementation: explicit boolean arrays

At `b3d5a36`, the code uses `_initializedPhases: boolean[]` and `_dirtyPhases: boolean[]`,
with `_setPhaseInitialized` and `_setPhaseDirty` methods. There are no packed flags,
bitwise operations, or generic flag/value setters. It still avoids eagerly
allocating an object for each component/phase pair. The public mutable object map
is created on first access and remains authoritative for subsequent reads.

A fresh comparison uses the same frozen input, dependencies, patches and timing
method above. Three samples per variant run in rotating order:

| Variant | Evaluation median | Peak RSS median |
| --- | ---: | ---: |
| Merged #4093 baseline | 5.765 s | 1,031 MiB |
| Previous packed-state implementation (`cb7f2b4`) | 4.473 s | 782 MiB |
| Boolean arrays | 4.699 s | 753 MiB |

The simpler implementation is **18.5% faster than baseline**, and takes **0.226 s
(5.1%) longer** than the packed version in this batch. Peak RSS is a whole-process
measurement affected by GC, not the size of the arrays themselves. This small
sample does not establish a memory advantage over packed storage.

All nine outputs match the same normalized hash and 66,219 records above, with no
errors or pours. Raw ordered samples are under `booleanArrayComparison` in the
results JSON. These measurements cover eval plus core rendering, not the browser
viewer. The 2-second target remains unmet.

## Final implementation: shared state objects

Store ordinary `{ initialized, dirty }` objects in `_phaseStatesByIndex`. The
renderer updates these objects directly. On first public access, build
`_phaseStatesByName` with references to the **same objects**, then keep returning
that map. There is no state reconstruction, boolean-array synchronization or
setter helper. Once exposed, read from the named map to honor callers replacing
entries or the whole map. This also preserves object identity when first access
and entry replacement both occur inside a render handler; a regression test
covers that case.

This restores the per-phase objects while avoiding eager construction of each
component's named map and its temporary entries. The original packed-storage
ablation above must not be interpreted as measuring this final representation.

Three fresh processes per variant, rotating order, on the same frozen AM62A input:

| Variant | Evaluation median | Peak RSS median |
| --- | ---: | ---: |
| Merged #4093 baseline | 5.896 s | 1,032 MiB |
| Previous boolean arrays (`b3d5a36`) | 4.898 s | 801 MiB |
| Shared state objects | 4.970 s | 884 MiB |

The final code is **15.7% faster than baseline** in this batch and **0.072 s
(1.5%) slower** than boolean arrays. Peak process memory is about 83 MiB higher
than boolean arrays, while remaining below baseline. This is a three-sample
comparison, not evidence of a universal speedup. Shared-object samples range
from 4.961 to 5.611 seconds. No samples were discarded.

All nine outputs match the same normalized hash and 66,219 records above, with no
errors or pours. Raw samples are under `sharedObjectComparison` in the results
JSON. The same timing boundaries apply; the 2-second target remains unmet.
