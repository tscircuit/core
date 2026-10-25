# Cached custom routing followed by native routing

The generated control board is fully routed by the built-in router. The new
regressions request an explicit follow-up after a cached custom prefix. Base
ignores that option, emits only one stage, and never attempts the remaining
route. They intentionally fail; the stacked fix supplies the missing opt-in.

![Successfully routed native control](native-control.png)

Coordinates are PCB world mm: +X right, +Y up, +Z above; right handed. The
custom synthetic prefix is one wire, and the follow-up must preserve it. No
AM3352 inputs or saved board routes are included. Each PR must report paired
fixture completion, stage/call counts, failures, elapsed time and inspected
visuals before merge.

## Explicit opt-in

```ts
const critical = withAutorouterCache(createCriticalRouter, "critical-v1", {
  followUpAutorouter: "default",
})
```

The custom router returns a transformed `getOutputSimpleRouteJson()` with the
remaining connections and accepted traces. Core preserves the first stage and
runs the next native stage against that handoff. It caches the stages separately:
a failed follow-up can retry without calling the expensive custom router again.
The algorithm identity still describes the first stage; follow-up configuration
does not change that identity. Unwrapped/custom routers without this option
remain final, preserving existing behavior. No prop-parser changes are required.

## Local paired fixture analysis

| Case | Complete, base → fix | End-event counts | Follow-up calls | Median ms |
| --- | --- | --- | --- | --- |
| normal | False → True | [1, 1] → [2, 2] | 0 → 2 | 73.4 → 183.2 |
| failed_followup | False → True | [1, 1] → [1, 2] | 0 → 2 | 74.6 → 73.7 |
| native_control | True → True | [1, 1] → [1, 1] | 0 → 0 | 93.4 → 89.7 |

All input hashes match. Both custom cases reuse the prefix once across two
renders; base never attempts the required follow-up and remains incomplete.
The fix completes both, including an injected first follow-up failure followed
by recovery with a first-stage cache hit. The emitted prefix geometry remains
unchanged. The native control's copper is byte-identical between revisions.

Five measured trials after one warmup, Bun 1.4.0, shared 4-vCPU Linux hardware
with board searches running. The fixed normal case does additional routing that
base omits; these timings are not a speed comparison between complete boards.
The benefit is retaining an accepted stage across later failures, verified by
call counts, cache metadata, actual emitted copper and successful completion.

Twelve relevant native tests pass (119 assertions), including the new recovery
fixtures and existing custom-cache, fanout, dogbone and bus-phase controls. The
Blacksmith workflow measures identical base/head fixtures, compares the native
control hash, and runs the nine existing routing/cache controls on both revisions.
Hosted comparison and full Core CI are pending; no merge has been performed.
