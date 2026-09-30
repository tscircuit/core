import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import type { LocalCacheEngine } from "lib/local-cache-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("recomputes a cached unknown JST PH orientation using the shared row analyzer", async () => {
  const oldCacheKey = "part-orientation-analysis:v3:jlcpcb:C131334"
  const newCacheKey = "part-orientation-analysis:v4:jlcpcb:C131334"
  const cache = new Map([
    [oldCacheKey, JSON.stringify({ pin1_location: null, pin1_polarity: null })],
  ])
  let orientationCacheWrites = 0
  const localCacheEngine: LocalCacheEngine = {
    getItem: (key) => cache.get(key) ?? null,
    setItem: (key, value) => {
      cache.set(key, value)
      if (key === newCacheKey) orientationCacheWrites++
    },
  }
  const partsEngine: PartsEngine = {
    findPart: () => ({ jlcpcb: ["C131334"] }),
    fetchPartCircuitJson: () => {
      // The imported C131334 footprint numbers the row from +X to -X.
      return [3, 1, -1, -3].map((x, index) => ({
        type: "pcb_plated_hole",
        pcb_plated_hole_id: `supplier_hole_${index + 1}`,
        shape: "circle",
        layers: ["top", "bottom"],
        x,
        y: -0.55,
        outer_diameter: 1.6,
        hole_diameter: 1,
        port_hints: [`pin${index + 1}`],
      })) as AnyCircuitElement[]
    },
  }

  for (let render = 0; render < 2; render++) {
    const { circuit } = getTestFixture({
      platform: { partsEngine, localCacheEngine },
    })
    circuit.add(
      <board width={20} height={20}>
        <connector
          name="J1"
          pcbRotation={90}
          footprint={
            <footprint insertionDirection="from_above">
              <platedhole
                pcbX={-3}
                pcbY={0}
                portHints={["pin1"]}
                shape="circle"
                holeDiameter={0.75}
                outerDiameter={1.4}
              />
              <platedhole
                pcbX={-1}
                pcbY={0}
                portHints={["pin2"]}
                shape="circle"
                holeDiameter={0.75}
                outerDiameter={1.4}
              />
              <platedhole
                pcbX={1}
                pcbY={0}
                portHints={["pin3"]}
                shape="circle"
                holeDiameter={0.75}
                outerDiameter={1.4}
              />
              <platedhole
                pcbX={3}
                pcbY={0}
                portHints={["pin4"]}
                shape="circle"
                holeDiameter={0.75}
                outerDiameter={1.4}
              />
              <silkscreentext text="J1 pin 1" pcbX={-4} pcbY={-1.5} />
            </footprint>
          }
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const j1 = circuit.db.pcb_component.list()[0]!
    expect(j1.pin1_location).toBe("topside_left")
    expect(j1.supplier_pin1_location_map?.jlcpcb).toBe("bottomside_right")
    expect(orientationCacheWrites).toBe(1)
    if (render === 0) expect(circuit).toMatchPcbSnapshot(import.meta.path)
  }
  expect(JSON.parse(cache.get(newCacheKey)!)).toMatchObject({
    pin1_location: "bottomside_right",
  })
})
