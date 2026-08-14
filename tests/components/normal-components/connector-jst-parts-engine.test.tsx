import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const createTwoPinJstPartCircuitJson = (
  vendorPinLabels: [string, string],
  padXOffset: number,
): AnyCircuitElement[] =>
  [
    {
      type: "source_component",
      source_component_id: "source_component_part",
      ftype: "simple_connector",
      name: "PART",
    },
    ...vendorPinLabels.flatMap((vendorPinLabel, pinIndex) => {
      const pinNumber = pinIndex + 1
      return [
        {
          type: "source_port",
          source_port_id: `source_port_${pinNumber}`,
          source_component_id: "source_component_part",
          name: vendorPinLabel,
          pin_number: pinNumber,
          port_hints: [vendorPinLabel],
        },
        {
          type: "pcb_port",
          pcb_port_id: `pcb_port_${pinNumber}`,
          pcb_component_id: "pcb_component_part",
          source_port_id: `source_port_${pinNumber}`,
          x: padXOffset + pinIndex * 2,
          y: 0,
          layers: ["top"],
        },
        {
          type: "pcb_smtpad",
          pcb_smtpad_id: `pcb_smtpad_${pinNumber}`,
          pcb_component_id: "pcb_component_part",
          pcb_port_id: `pcb_port_${pinNumber}`,
          shape: "rect",
          x: padXOffset + pinIndex * 2,
          y: 0,
          width: 1,
          height: 1.5,
          layer: "top",
          port_hints: [`pin${pinNumber}`, vendorPinLabel],
        },
      ]
    }),
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_part",
      source_component_id: "source_component_part",
      center: { x: 0, y: 0 },
      width: 4,
      height: 2,
      layer: "top",
      rotation: 0,
    },
  ] as unknown as AnyCircuitElement[]

test("JST connectors select parts by family and pin count while keeping a stable schematic", async () => {
  const { circuit: circuitA } = getTestFixture()
  const { circuit: circuitB } = getTestFixture()
  const findPartCalls: Array<{
    standard?: string
    pinCount?: number
    footprinterString?: string
  }> = []

  const createPartsEngine = (
    supplierPartNumber: string,
    partCircuitJson: AnyCircuitElement[],
  ): PartsEngine => ({
    findPart: async ({ sourceComponent, footprinterString }: any) => {
      findPartCalls.push({
        standard: sourceComponent.standard,
        pinCount: sourceComponent.pin_count,
        footprinterString,
      })
      return { jlcpcb: [supplierPartNumber] }
    },
    fetchPartCircuitJson: async ({ supplierPartNumber: requestedPart }) =>
      requestedPart === supplierPartNumber ? partCircuitJson : undefined,
  })

  circuitA.add(
    <board
      partsEngine={createPartsEngine(
        "C-JST-A",
        createTwoPinJstPartCircuitJson(["VENDOR_A1", "VENDOR_A2"], -1),
      )}
      width="20mm"
      height="20mm"
    >
      <connector name="J1" standard="jst_ph" pinCount={2} />
      <pcbnotetext text="Fetched JST-PH 2-pin footprint" pcbX={0} pcbY={3} />
    </board>,
  )
  circuitB.add(
    <board
      partsEngine={createPartsEngine(
        "C-JST-B",
        createTwoPinJstPartCircuitJson(["VENDOR_B1", "VENDOR_B2"], -0.5),
      )}
      width="20mm"
      height="20mm"
    >
      <connector name="J1" standard="jst_ph" pinCount={2} />
    </board>,
  )

  await circuitA.renderUntilSettled()
  await circuitB.renderUntilSettled()

  expect(findPartCalls).toEqual([
    {
      standard: "jst_ph",
      pinCount: 2,
      footprinterString: "standard:jst_ph",
    },
    {
      standard: "jst_ph",
      pinCount: 2,
      footprinterString: "standard:jst_ph",
    },
  ])

  const getSchematicPortSummary = (circuit: typeof circuitA) =>
    circuit.db.schematic_port
      .list()
      .sort((a, b) => (a.pin_number ?? 0) - (b.pin_number ?? 0))
      .map((schematicPort) => ({
        pinNumber: schematicPort.pin_number,
        side: schematicPort.side_of_component,
        displayPinLabel: schematicPort.display_pin_label,
      }))

  expect(getSchematicPortSummary(circuitA)).toEqual(
    getSchematicPortSummary(circuitB),
  )
  expect(
    getSchematicPortSummary(circuitA).map((port) => port.pinNumber),
  ).toEqual([1, 2])
  expect(getSchematicPortSummary(circuitA).map((port) => port.side)).toEqual([
    "right",
    "right",
  ])
  expect(
    getSchematicPortSummary(circuitA).map((port) => port.displayPinLabel),
  ).toEqual([undefined, undefined])

  for (const circuit of [circuitA, circuitB]) {
    const sourceConnector = circuit.db.source_component
      .list()
      .find((sourceComponent) => sourceComponent.name === "J1") as any
    expect(sourceConnector.standard).toBe("jst_ph")
    expect(sourceConnector.pin_count).toBe(2)
    expect(circuit.db.source_port.list()).toHaveLength(2)
    expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
  }

  expect(circuitA).toMatchSchematicSnapshot(import.meta.path)
  expect(circuitA).toMatchPcbSnapshot(import.meta.path)
})
