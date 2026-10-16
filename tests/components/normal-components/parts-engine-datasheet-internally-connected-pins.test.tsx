import type { DatasheetPartCircuitJsonRequest } from "lib/utils/fetch-part-circuit-json-with-datasheet"
import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import type { PartsEngine } from "@tscircuit/props"
import type { Port } from "lib/components/primitive-components/Port"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import footprint from "tests/fixtures/assets/external-0402-footprint.json"

test("imported internal connections reach connectivity checks and explicit empty groups override them", async () => {
  const { circuit } = getTestFixture()
  const imported = [
    ...footprint.map((element) =>
      element.type === "source_component"
        ? {
            ...element,
            internally_connected_source_port_ids: [["supplierA", "supplierB"]],
          }
        : element,
    ),
    ...[1, 2].map((pin_number) => ({
      type: "source_port",
      source_port_id: pin_number === 1 ? "supplierA" : "supplierB",
      source_component_id: "generic_0",
      name: `pin${pin_number}`,
      pin_number,
      port_hints: [String(pin_number), `pin${pin_number}`],
    })),
  ] as AnyCircuitElement[]
  const original = structuredClone(imported)
  const requests: boolean[] = []
  const partsEngine: PartsEngine = {
    findPart: async () => ({}),
    fetchPartCircuitJson: async (request: DatasheetPartCircuitJsonRequest) => {
      requests.push(request.includeDatasheetInformation === true)
      return imported
    },
  }
  circuit.add(
    <board width={16} height={10} partsEngine={partsEngine} routingDisabled>
      <chip
        name="U1"
        footprint="jlcpcb:C_INTERNAL"
        supplierPartNumbers={{ jlcpcb: ["C_INTERNAL"] }}
        pinLabels={{ pin1: "A", pin2: "B" }}
        pinAttributes={{ pin2: { requiresGround: true } }}
        pcbX={-3}
      />
      <chip
        name="U2"
        footprint="jlcpcb:C_OVERRIDE"
        supplierPartNumbers={{ jlcpcb: ["C_OVERRIDE"] }}
        internallyConnectedPins={[]}
        pinLabels={{ pin1: "A", pin2: "B" }}
        pinAttributes={{ pin2: { requiresGround: true } }}
        pcbX={3}
      />
      <trace from=".U1 > .A" to="net.GND" />
      <trace from=".U2 > .A" to="net.GND" />
      <pcbnotetext
        pcbY={-3}
        text="U1 A-B internally connected; U2 overrides with []"
        fontSize={0.45}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(requests.filter(Boolean)).toHaveLength(2)
  const components = circuit.db.source_component.list()
  const u1 = components.find((component) => component.name === "U1")!
  const u2 = components.find((component) => component.name === "U2")!
  const ids = circuit.db.source_port
    .list()
    .filter((port) => port.source_component_id === u1.source_component_id)
    .map((port) => port.source_port_id)
  expect(u1.internally_connected_source_port_ids).toEqual([ids])
  expect(u2.internally_connected_source_port_ids ?? []).toEqual([])
  expect((circuit.selectOne(".U1 > .B") as Port).isConnectedToGround()).toBe(
    true,
  )
  expect((circuit.selectOne(".U2 > .B") as Port).isConnectedToGround()).toBe(
    false,
  )
  expect(
    circuit.db.source_pin_missing_trace_warning
      .list()
      .filter(
        (warning) => warning.source_component_id === u1.source_component_id,
      ),
  ).toHaveLength(0)
  expect(
    circuit.db.source_pin_missing_trace_warning
      .list()
      .filter(
        (warning) => warning.source_component_id === u2.source_component_id,
      ),
  ).toHaveLength(1)
  const connectionWarnings =
    circuit.db.source_component_pins_underspecified_warning
      .list()
      .filter((warning) => warning.message.includes("internallyConnectedPins"))
  expect(connectionWarnings).toHaveLength(2)
  expect(
    connectionWarnings.find(
      (warning) => warning.source_component_id === u1.source_component_id,
    )?.message,
  ).toContain("isn't set")
  expect(
    connectionWarnings.find(
      (warning) => warning.source_component_id === u2.source_component_id,
    )?.message,
  ).toContain("does not declare that connection")
  expect(imported).toEqual(original)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
