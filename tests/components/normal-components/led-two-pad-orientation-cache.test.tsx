import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import type { LocalCacheEngine } from "lib/local-cache-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("recomputes cached unknown LED orientation and reuses the new frame", async () => {
  const oldCacheKey = "part-orientation-analysis:v2:jlcpcb:C123"
  const cache = new Map([
    [oldCacheKey, JSON.stringify({ pin1_location: null, pin1_polarity: null })],
  ])
  let orientationCacheWrites = 0
  const localCacheEngine: LocalCacheEngine = {
    getItem: (key) => cache.get(key) ?? null,
    setItem: (key, value) => {
      cache.set(key, value)
      if (key.startsWith("part-orientation-analysis:")) orientationCacheWrites++
    },
  }
  const partsEngine: PartsEngine = {
    findPart: () => ({ jlcpcb: ["C123"] }),
    fetchPartCircuitJson: () => {
      // Synthetic supplier footprint, in local mm: +X right, +Y up.
      // Pin 1 is right, opposite to the authored LED's local footprint.
      return [1, 2].map((pin) => ({
        type: "pcb_smtpad",
        pcb_smtpad_id: `supplier_pad_${pin}`,
        shape: "rect",
        x: pin === 1 ? 0.749 : -0.749,
        y: 0,
        width: 0.8,
        height: 0.8,
        layer: "top",
        port_hints: [`pin${pin}`],
      })) as AnyCircuitElement[]
    },
  }
  for (let render = 0; render < 2; render++) {
    const { circuit } = getTestFixture({
      platform: {
        partsEngine,
        localCacheEngine,
        enablePartOrientationAnalysis: true,
      },
    })
    circuit.add(
      <board width={12} height={6}>
        <led
          name="LED1"
          pinLabels={{ pin1: ["cathode", "neg"], pin2: ["anode", "pos"] }}
          footprint="smdpads2_p1.498mm_pw0.8mm_ph0.8mm"
        />
        <silkscreentext text="K left / A right" pcbY={-2} fontSize={0.7} />
      </board>,
    )
    await circuit.renderUntilSettled()
    const pcb = circuit.db.pcb_component.list()[0]!
    expect(pcb.pin1_location).toBe("topside_left")
    expect(pcb.supplier_pin1_location_map).toEqual({
      jlcpcb: "bottomside_right",
    })
    expect(orientationCacheWrites).toBe(1)
    if (render === 0) expect(circuit).toMatchPcbSnapshot(import.meta.path)
  }
  expect(
    JSON.parse(cache.get("part-orientation-analysis:v3:jlcpcb:C123")!),
  ).toMatchObject({ pin1_location: "bottomside_right" })
})
