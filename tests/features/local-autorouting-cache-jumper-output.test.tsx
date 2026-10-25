import { expect, test } from "bun:test"
import type { AutoroutingStartEvent } from "lib/events"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("cached auto-jumper routing restores the jumper components and pads", async () => {
  const cache = new Map<string, string>()
  const render = async () => {
    const { circuit } = getTestFixture({
      platform: {
        localCacheEngine: {
          getItem: (key) => cache.get(key) ?? null,
          setItem: (key, value) => {
            cache.set(key, value)
          },
        },
      },
    })
    const starts: AutoroutingStartEvent[] = []
    circuit.on("autorouting:start", (event) => starts.push(event))
    circuit.add(
      <board
        width="18mm"
        layers={1}
        autorouter={{ preset: "auto_jumper", availableJumperTypes: ["1206x4"] }}
        autorouterEffortLevel="2x"
      >
        <chip
          name="U1"
          footprint="dip16_w14"
          connections={{
            pin1: "U1.pin9",
            pin2: "U1.pin10",
            pin3: "U1.pin11",
            pin4: "U1.pin12",
            pin5: "U1.pin13",
            pin6: "U1.pin14",
            pin7: "U1.pin15",
            pin8: "U1.pin16",
          }}
        />
        <pcbnotetext
          text="Cached routing must retain the physical jumper"
          pcbY={12}
          fontSize={0.5}
        />
      </board>,
    )
    const started = performance.now()
    await circuit.renderUntilSettled()
    const jumpers = circuit.db.source_component
      .list()
      .filter((c) => c.name?.startsWith("__autoplaced_jumper"))
    const jumperIds = new Set(jumpers.map((c) => c.source_component_id))
    const pcbJumpers = circuit.db.pcb_component
      .list()
      .filter((c) => jumperIds.has(c.source_component_id))
    const pcbIds = new Set(pcbJumpers.map((c) => c.pcb_component_id))
    return {
      circuit,
      starts,
      jumpers,
      pcbJumpers,
      pads: circuit.db.pcb_smtpad
        .list()
        .filter(
          (p) =>
            p.pcb_component_id !== undefined && pcbIds.has(p.pcb_component_id),
        ),
      milliseconds: performance.now() - started,
    }
  }
  const cold = await render()
  expect(cold.jumpers.length).toBeGreaterThan(0)
  expect(cold.circuit).toMatchPcbSnapshot(import.meta.path)
  const warm = await render()
  console.log(
    "CACHE_JUMPER_BENCHMARK",
    JSON.stringify({
      coldMs: cold.milliseconds,
      warmMs: warm.milliseconds,
      coldJumpers: cold.jumpers.length,
      warmJumpers: warm.jumpers.length,
      coldPads: cold.pads.length,
      warmPads: warm.pads.length,
      cacheStatuses: [cold.starts[0]?.cacheStatus, warm.starts[0]?.cacheStatus],
    }),
  )
  expect(warm.starts[0]?.cacheStatus).toBe("hit")
  expect(warm.jumpers).toEqual(cold.jumpers)
  expect(warm.pcbJumpers).toEqual(cold.pcbJumpers)
  expect(warm.pads).toEqual(cold.pads)
  expect(warm.circuit.db.pcb_trace.list()).toEqual(
    cold.circuit.db.pcb_trace.list(),
  )
}, 60_000)
