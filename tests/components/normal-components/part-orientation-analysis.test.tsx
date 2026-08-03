import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement, PcbSmtPadRect } from "circuit-json"
import type { LocalCacheEngine } from "lib/local-cache-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const createSupplierPad = (
  pinNumber: number,
  x: number,
  y: number,
): PcbSmtPadRect => ({
  type: "pcb_smtpad",
  shape: "rect",
  pcb_smtpad_id: `pcb_smtpad_${pinNumber}`,
  x,
  y,
  width: 0.5,
  height: 1,
  layer: "top",
  port_hints: [`pin${pinNumber}`],
})

const jlcpcbFootprint = [
  createSupplierPad(1, -1, -2),
  createSupplierPad(2, 1, -2),
  createSupplierPad(3, 1, 2),
  createSupplierPad(4, -1, 2),
] as AnyCircuitElement[]

const pcbwayFootprint = [
  createSupplierPad(1, -2, 1),
  createSupplierPad(2, 2, 1),
  createSupplierPad(3, 2, -1),
  createSupplierPad(4, -2, -1),
] as AnyCircuitElement[]

const createTestBoard = () => (
  <board width="20mm" height="20mm">
    <chip
      name="U1"
      pcbRotation={90}
      layer="bottom"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX={-2}
            pcbY={1}
            width={0.5}
            height={1}
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX={-2}
            pcbY={-1}
            width={0.5}
            height={1}
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX={2}
            pcbY={-1}
            width={0.5}
            height={1}
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX={2}
            pcbY={1}
            width={0.5}
            height={1}
            shape="rect"
          />
        </footprint>
      }
    />
  </board>
)

test("part orientation analysis enriches pcb components and uses the platform cache", async () => {
  const cache = new Map<string, string>()
  const orientationCacheWrites: string[] = []
  const localCacheEngine: LocalCacheEngine = {
    getItem: (key) => cache.get(key) ?? null,
    setItem: (key, value) => {
      cache.set(key, value)
      if (key.startsWith("part-orientation-analysis:")) {
        orientationCacheWrites.push(key)
      }
    },
  }
  const partsEngine: PartsEngine = {
    findPart: () => ({
      jlcpcb: ["C123"],
      pcbway: ["P456"],
    }),
    fetchPartCircuitJson: ({ supplierPartNumber }) =>
      supplierPartNumber === "C123" ? jlcpcbFootprint : pcbwayFootprint,
  }
  const platform = {
    partsEngine,
    localCacheEngine,
    usePartOrientationAnalysis: true,
  }

  const firstFixture = getTestFixture({ platform })
  firstFixture.circuit.add(createTestBoard())
  await firstFixture.circuit.renderUntilSettled()

  const firstPcbComponent = firstFixture.circuit.db.pcb_component.list()[0]!
  expect(firstPcbComponent.pin1_location).toBe("leftside_top")
  expect(firstPcbComponent.supplier_pin1_location_map).toEqual({
    jlcpcb: "bottomside_left",
    pcbway: "topside_left",
  })
  expect(orientationCacheWrites).toHaveLength(2)
  expect(firstFixture.circuit).toMatchPcbSnapshot(import.meta.path)

  const secondFixture = getTestFixture({ platform })
  secondFixture.circuit.add(createTestBoard())
  await secondFixture.circuit.renderUntilSettled()

  const secondPcbComponent = secondFixture.circuit.db.pcb_component.list()[0]!
  expect(secondPcbComponent.pin1_location).toBe("leftside_top")
  expect(secondPcbComponent.supplier_pin1_location_map).toEqual({
    jlcpcb: "bottomside_left",
    pcbway: "topside_left",
  })
  expect(orientationCacheWrites).toHaveLength(2)
})
