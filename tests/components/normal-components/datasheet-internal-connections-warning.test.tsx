import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { source_component_pins_underspecified_warning } from "circuit-json"
import type { Chip } from "lib/components/normal-components/Chip"
import type { DatasheetPartCircuitJsonRequest } from "lib/utils/fetch-part-circuit-json-with-datasheet"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom footprints fetch datasheet facts without pinAttributes and warn until internal groups are declared", async () => {
  const imported: AnyCircuitElement[] = [
    {
      type: "source_component",
      ftype: "simple_chip",
      source_component_id: "supplier",
      name: "SW1",
      manufacturer_part_number: "TS-1187A-B-A-B",
      internally_connected_source_port_ids: [
        ["supplierA", "supplierB"],
        ["supplierC", "supplierD"],
      ],
    },
    ...["A", "B", "C", "D"].map((name) => ({
      type: "source_port" as const,
      source_component_id: "supplier",
      source_port_id: `supplier${name}`,
      name: `pin${name}`,
      port_hints: [name],
    })),
  ]
  const original = structuredClone(imported)
  let fetches = 0
  const partsEngine: PartsEngine = {
    findPart: async () => ({}),
    fetchPartCircuitJson: async (request: DatasheetPartCircuitJsonRequest) => {
      expect(request.includeDatasheetInformation).toBe(true)
      expect(request.manufacturerPartNumber).toBe("TS-1187A-B-A-B")
      fetches++
      return imported
    },
  }
  const { circuit } = getTestFixture()
  const labels = { pin1: "A", pin2: "B", pin3: "C", pin4: "D" }
  circuit.add(
    <board width={28} height={16} partsEngine={partsEngine} routingDisabled>
      <chip
        name="U1"
        manufacturerPartNumber="TS-1187A-B-A-B"
        pcbX={-7}
        footprint="pinrow4"
        pinLabels={labels}
      />
      <pushbutton
        name="SW1"
        manufacturerPartNumber="TS-1187A-B-A-B"
        footprint="pushbutton"
        pinLabels={labels}
        pcbX={7}
      />
      <pcbnotetext
        pcbY={-6}
        text="Datasheet says A-B and C-D; internallyConnectedPins is missing"
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(fetches).toBe(2)
  const warnings =
    circuit.db.source_component_pins_underspecified_warning.list()
  expect(warnings).toHaveLength(2)
  for (const warning of warnings) {
    expect(
      source_component_pins_underspecified_warning.safeParse(warning).success,
    ).toBe(true)
    expect(warning.message).toContain(
      "The datasheet reports pins A and B are internally connected, but the internallyConnectedPins prop isn't set",
    )
    expect(warning.message).toContain("pins C and D are internally connected")
    expect(warning.source_port_ids).toHaveLength(4)
    expect(warning.message).not.toContain("supplier")
    expect(warning.message).not.toContain(warning.source_component_id)
  }
  const chip = circuit.selectOne(".U1") as Chip<string>
  expect(chip.props.internallyConnectedPins).toBeUndefined()
  chip.updateSourceDesignRuleChecks()
  expect(
    circuit.db.source_component_pins_underspecified_warning.list(),
  ).toEqual(warnings)
  expect(fetches).toBe(2)
  chip.setProps({
    ...chip.props,
    internallyConnectedPins: [
      ["A", "B"],
      [3, "pin4"],
    ],
  })
  chip.updateSourceDesignRuleChecks()
  expect(
    circuit.db.source_component_pins_underspecified_warning
      .list()
      .find(
        (warning) => warning.source_component_id === chip.source_component_id,
      )?.message ?? "",
  ).not.toContain("internallyConnectedPins")
  expect(imported).toEqual(original)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
