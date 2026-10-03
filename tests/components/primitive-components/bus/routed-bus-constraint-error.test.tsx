import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routed bus length violations emit specific diagnostics through board DRC", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={8} layers={1}>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
      <trace name="DATA" from=".R1 > .pin1" to=".R2 > .pin1" />
      <bus name="DATA_BUS" connections={["DATA"]} maxLength="1mm" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const source = circuit.db.source_trace.getWhere({ name: "DATA" })!
  const bus = circuit.db.source_bus.getWhere({ name: "DATA_BUS" })!
  const json = circuit.getCircuitJson()
  const error = json.find((e) => e.type === "pcb_bus_routing_constraint_error")
  expect(error).toMatchObject({
    type: "pcb_bus_routing_constraint_error",
    source_bus_id: bus.source_bus_id,
    source_trace_ids: [source.source_trace_id],
    routing_rule: "max_length",
    maximum_trace_length: 1,
  })
  if (
    !error ||
    error.type !== "pcb_bus_routing_constraint_error" ||
    error.routing_rule !== "max_length"
  )
    throw new Error("Missing specific constraint error")
  expect(error.actual_trace_length).toBeGreaterThan(1)
  expect(error.pcb_trace_ids).toEqual(
    json.filter((e) => e.type === "pcb_trace").map((e) => e.pcb_trace_id),
  )
  expect(json.some((e) => e.type === "pcb_trace_missing_error")).toBe(false)
})
