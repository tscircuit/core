import type { DatasheetPartCircuitJsonRequest } from "lib/utils/fetch-part-circuit-json-with-datasheet"
import { expect, test } from "bun:test"
import { fp } from "@tscircuit/footprinter"
import type { PartsEngine } from "@tscircuit/props"
import type { Port } from "lib/components/primitive-components/Port"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("supplier pushbutton requests datasheet groups and keeps its two switch terminals separate", async () => {
  const { circuit } = getTestFixture()
  const geometry = fp.string("smdpushbutton").circuitJson()
  const sourceComponentId = "supplier"
  const imported = [
    {
      type: "source_component" as const,
      ftype: "simple_chip" as const,
      name: "SW1",
      source_component_id: sourceComponentId,
      internally_connected_source_port_ids: [
        ["A", "B"],
        ["C", "D"],
      ],
    },
    ...geometry
      .filter((element) => element.type !== "source_port")
      .map((element) =>
        element.type === "source_component"
          ? {
              ...element,
              internally_connected_source_port_ids: [
                ["A", "B"],
                ["C", "D"],
              ],
            }
          : element,
      ),
    ...["A", "B", "C", "D"].map((name, i) => ({
      type: "source_port" as const,
      source_component_id: sourceComponentId,
      source_port_id: name,
      name: `pin${i + 1}`,
      pin_number: i + 1,
      port_hints: [name, `pin${i + 1}`],
    })),
  ]
  let enriched = false
  const partsEngine: PartsEngine = {
    findPart: async () => ({}),
    fetchPartCircuitJson: async (request: DatasheetPartCircuitJsonRequest) => {
      enriched ||= request.includeDatasheetInformation === true
      return imported
    },
  }
  circuit.add(
    <board width={16} height={14} partsEngine={partsEngine} routingDisabled>
      <pushbutton
        name="SW1"
        footprint="jlcpcb:C318884"
        supplierPartNumbers={{ jlcpcb: ["C318884"] }}
        manufacturerPartNumber="TS-1187A-B-A-B"
        pinLabels={{ pin1: "A", pin2: "B", pin3: "C", pin4: "D" }}
      />
      <trace from=".SW1 > .A" to="net.GND" />
      <trace from=".SW1 > .C" to="net.SIGNAL" />
      <pcbnotetext
        pcbY={-5}
        text="TS-1187A-B-A-B: A-B and C-D permanently connected"
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(enriched).toBe(true)
  const sw = circuit.db.source_component
    .list()
    .find((component) => component.name === "SW1")!
  expect(sw.internally_connected_source_port_ids).toHaveLength(2)
  expect((circuit.selectOne(".SW1 > .B") as Port).isConnectedToGround()).toBe(
    true,
  )
  expect((circuit.selectOne(".SW1 > .D") as Port).isConnectedToGround()).toBe(
    false,
  )
  expect(circuit.db.source_pin_missing_trace_warning.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
