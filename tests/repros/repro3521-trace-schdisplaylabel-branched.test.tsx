import { expect, test } from "bun:test"
import { Circuit } from "lib/index"

test("trace schDisplayLabel on two connected traces emits schematic_text instead of schematic_net_label", async () => {
  const circuit = new Circuit()
  circuit.add(
    <board width="30mm" height="30mm">
      <chip name="J1" footprint="soic8" pinLabels={{ 1: "V_PLUS" }} />
      <resistor name="R_SHUNT" footprint="0402" resistance="1k" />
      <resistor name="R_FILTER" footprint="0402" resistance="1k" />
      <trace from=".J1 > .V_PLUS" to=".R_SHUNT > .pin2" schDisplayLabel="V+" />
      <trace from=".R_SHUNT > .pin2" to=".R_FILTER > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()
  const netLabels = circuitJson.filter(
    (el) => el.type === "schematic_net_label",
  )
  const schematicTexts = circuitJson.filter(
    (el) => el.type === "schematic_text" && (el as any).text === "V+",
  )

  expect(netLabels.length).toBe(0)
  expect(schematicTexts.length).toBeGreaterThan(0)
  expect((schematicTexts[0] as any).source_trace_id).toBeDefined()
})

test("trace schDisplayLabel with 3-terminal path emits schematic_text instead of schematic_net_label", async () => {
  const circuit = new Circuit()
  circuit.add(
    <board width="30mm" height="30mm">
      <chip name="J1" footprint="soic8" pinLabels={{ 1: "V_PLUS" }} />
      <resistor name="R_SHUNT" footprint="0402" resistance="1k" />
      <resistor name="R_FILTER" footprint="0402" resistance="1k" />
      <trace
        name="V-PLUS-INPUT"
        path={[".J1 > .V_PLUS", ".R_SHUNT > .pin2", ".R_FILTER > .pin1"]}
        schDisplayLabel="V+"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()
  const netLabels = circuitJson.filter(
    (el) => el.type === "schematic_net_label",
  )
  const schematicTexts = circuitJson.filter(
    (el) => el.type === "schematic_text" && (el as any).text === "V+",
  )

  expect(netLabels.length).toBe(0)
  expect(schematicTexts.length).toBeGreaterThan(0)
  expect((schematicTexts[0] as any).source_trace_id).toBeDefined()
})
