/**
 * Run: bun benchmarking/scripts/benchmark-async-pcb-port-matching.ts [port-count]
 * Compare the production late-match fix with #4284's named-map guard and the
 * pre-fix method. Measures initial matching only; Port construction, module
 * startup and output inspection are excluded. This is not a full render benchmark.
 */
import { Port } from "lib/components/primitive-components/Port/Port"
import { SmtPad } from "lib/components/primitive-components/SmtPad"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"

const implementations = {
  base: function (this: Port, pad: PrimitiveComponent) {
    this.matchedComponents.push(pad)
  },
  pr4284: function (this: Port, pad: PrimitiveComponent) {
    this.matchedComponents.push(pad)
    if (
      pad.isPcbPrimitive &&
      this.renderPhaseStates.PcbPortRender.initialized
    ) {
      this._markDirty("PcbPortRender")
    }
  },
  alternative: Port.prototype.registerMatch,
}
const variants = Object.keys(
  implementations,
) as (keyof typeof implementations)[]
const portCount = Number(process.argv[2] ?? 3000)
const rounds = 18
const warmups = 3
const pad = new SmtPad({ shape: "rect", width: 1, height: 1 })
const samples: {
  round: number
  variant: keyof typeof implementations
  elapsedMs: number
  namedPhaseMaps: number
}[] = []

for (let round = -warmups; round < rounds; round++) {
  const order = variants.map(
    (_, i) => variants[(i + round + warmups) % variants.length],
  )
  if (Math.floor((round + warmups) / variants.length) % 2) order.reverse()
  for (const variant of order) {
    const ports = Array.from(
      { length: portCount },
      (_, i) => new Port({ name: `pin${i + 1}` }),
    )
    const registerMatch = implementations[variant]
    const start = performance.now()
    for (const port of ports) registerMatch.call(port, pad)
    const elapsedMs = performance.now() - start
    // Diagnostic access stays outside the timer and never invokes the lazy getter.
    const namedPhaseMaps = ports.filter((port) =>
      Boolean((port as any)._phaseStatesByName),
    ).length
    if (round >= 0) samples.push({ round, variant, elapsedMs, namedPhaseMaps })
  }
}

const median = (values: number[]) => {
  const sorted = values.toSorted((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}
console.log(
  JSON.stringify(
    {
      bun: Bun.version,
      platform: process.platform,
      arch: process.arch,
      portCount,
      rounds,
      warmups,
      summary: Object.fromEntries(
        variants.map((variant) => {
          const matchingSamples = samples.filter((s) => s.variant === variant)
          return [
            variant,
            {
              medianMs: median(matchingSamples.map((s) => s.elapsedMs)),
              namedPhaseMaps: matchingSamples[0].namedPhaseMaps,
            },
          ]
        }),
      ),
      samples,
    },
    null,
    2,
  ),
)
