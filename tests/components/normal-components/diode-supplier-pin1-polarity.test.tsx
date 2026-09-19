import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import type { LocalCacheEngine } from "lib/local-cache-engine"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type Pin1Polarity = "anode" | "cathode" | "unknown"

const createSupplierDiodeCircuitJson = (
  pin1Polarity: Pin1Polarity,
): AnyCircuitElement[] => {
  const polarityHints =
    pin1Polarity === "anode"
      ? { pin1: "_POS", pin2: "_NEG" }
      : pin1Polarity === "cathode"
        ? { pin1: "_NEG", pin2: "_POS" }
        : { pin1: "1", pin2: "2" }

  return [
    {
      type: "source_port",
      source_port_id: "supplier_source_port_1",
      source_component_id: "supplier_source_component_1",
      name: "pin1",
      pin_number: 1,
      port_hints: [polarityHints.pin1],
    },
    {
      type: "source_port",
      source_port_id: "supplier_source_port_2",
      source_component_id: "supplier_source_component_1",
      name: "pin2",
      pin_number: 2,
      port_hints: [polarityHints.pin2],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "supplier_pad_1",
      shape: "rect",
      x: -1,
      y: 0,
      width: 0.8,
      height: 1,
      layer: "top",
      port_hints: ["pin1"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "supplier_pad_2",
      shape: "rect",
      x: 1,
      y: 0,
      width: 0.8,
      height: 1,
      layer: "top",
      port_hints: ["pin2"],
    },
  ] as AnyCircuitElement[]
}

test("rejects diode and LED supplier frames with mismatched polarity, including cached frames", async () => {
  const cache = new Map<string, string>()
  let orientationCacheWrites = 0
  const localCacheEngine: LocalCacheEngine = {
    getItem: (key) => cache.get(key) ?? null,
    setItem: (key, value) => {
      cache.set(key, value)
      if (key.startsWith("part-orientation-analysis:")) {
        orientationCacheWrites += 1
      }
    },
  }
  const partsEngine: PartsEngine = {
    findPart: () => ({ jlcpcb: ["C8598"], pcbway: ["matching-diode"] }),
    fetchPartCircuitJson: ({ supplierPartNumber }) => {
      if (supplierPartNumber === "C8598") {
        return createSupplierDiodeCircuitJson("cathode")
      }
      return createSupplierDiodeCircuitJson("anode")
    },
  }
  const platform = {
    partsEngine,
    localCacheEngine,
    enablePartOrientationAnalysis: true,
  }

  for (let renderIndex = 0; renderIndex < 2; renderIndex++) {
    const { circuit } = getTestFixture({ platform })
    circuit.add(
      <board width="20mm" height="20mm">
        <diode name="D1" footprint="0603" />
        <led name="LED1" footprint="0805" pcbX={4} />
      </board>,
    )

    await circuit.renderUntilSettled()

    const errors = circuit.db.source_component_misconfigured_error.list()
    const pin1SourcePort = circuit.db.source_port
      .list()
      .find((port) => port.pin_number === 1)!
    expect(errors).toHaveLength(2)
    expect(errors[0]).toMatchObject({
      error_type: "source_component_misconfigured_error",
      source_component_ids: [
        circuit.db.source_component.list()[0]!.source_component_id,
      ],
      source_port_ids: [pin1SourcePort.source_port_id],
    })
    expect(errors[0]!.message).toContain("jlcpcb:C8598")
    expect(errors[0]!.message).toContain("pin 1 to the anode")
    expect(errors[0]!.message).toContain("pin 1 to the cathode")
    for (const pcbComponent of circuit.db.pcb_component.list()) {
      expect(pcbComponent.pin1_location).toBeDefined()
      expect(pcbComponent.supplier_pin1_location_map?.jlcpcb).toBeUndefined()
      expect(pcbComponent.supplier_pin1_location_map?.pcbway).toBeDefined()
    }
  }

  expect(orientationCacheWrites).toBe(2)
  expect(
    [...cache.keys()].filter((key) =>
      key.startsWith("part-orientation-analysis:"),
    ),
  ).toEqual([
    "part-orientation-analysis:v3:jlcpcb:C8598",
    "part-orientation-analysis:v3:pcbway:matching-diode",
  ])
})

test("accepts diode and LED pin 1 mappings that match the supplier", async () => {
  const partsEngine: PartsEngine = {
    findPart: () => ({ jlcpcb: ["C8598"] }),
    fetchPartCircuitJson: () => createSupplierDiodeCircuitJson("cathode"),
  }
  const { circuit } = getTestFixture({
    platform: { partsEngine, enablePartOrientationAnalysis: true },
  })
  const cathodeFirstPinLabels = {
    pin1: ["cathode", "neg"],
    pin2: ["anode", "pos"],
  } as const

  circuit.add(
    <board width="20mm" height="20mm">
      <diode name="D1" footprint="0603" pinLabels={cathodeFirstPinLabels} />
      <led name="LED1" footprint="0603" pinLabels={cathodeFirstPinLabels} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_component_misconfigured_error.list()).toEqual([])
  for (const pcbComponent of circuit.db.pcb_component.list()) {
    expect(pcbComponent.supplier_pin1_location_map?.jlcpcb).toBeDefined()
  }
})

test("does not guess when supplier pin 1 polarity is unknown", async () => {
  const partsEngine: PartsEngine = {
    findPart: () => ({ jlcpcb: ["CUNKNOWN"] }),
    fetchPartCircuitJson: () => createSupplierDiodeCircuitJson("unknown"),
  }
  const { circuit } = getTestFixture({
    platform: { partsEngine, enablePartOrientationAnalysis: true },
  })

  circuit.add(
    <board width="20mm" height="20mm">
      <diode name="D1" footprint="0603" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_component_misconfigured_error.list()).toEqual([])
  expect(
    circuit.db.pcb_component.list()[0]!.supplier_pin1_location_map?.jlcpcb,
  ).toBeDefined()
})
