import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a trace whose ends resolve to the same port is reported", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={8} />
      <net name="VCC" />
      <trace from=".R1 > .pin1" to=".R1 > .pin1" />
      {/* Valid traces in the same board must be unaffected. */}
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <trace from=".R2 > .pin2" to="net.VCC" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter((e: any) =>
    String(e.type).includes("error"),
  ) as any[]
  const sourceTraces = circuitJson.filter(
    (e: any) => e.type === "source_trace",
  ) as any[]

  // This used to emit a source_trace listing the same port twice, with no
  // diagnostic at all.
  expect(errors.length).toBe(1)
  expect(errors[0].message).toContain("connects a port to itself")

  // The two real traces still exist...
  expect(sourceTraces.length).toBe(2)
  // ...and no trace lists a duplicated port.
  for (const trace of sourceTraces) {
    const ids = trace.connected_source_port_ids ?? []
    expect(new Set(ids).size).toBe(ids.length)
  }
})

test("a trace from a port to its own net is not flagged", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} />
      <net name="VCC" />
      <trace from=".R1 > .pin1" to="net.VCC" />
      <trace from=".R1 > .pin2" to="net.VCC" />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Both pins joining the same net is a legitimate (if unusual) circuit, and a
  // single-port trace to a net resolves to one port — neither must trip the
  // self-connection check.
  const errors = circuit
    .getCircuitJson()
    .filter((e: any) => String(e.type).includes("error"))

  expect(errors).toEqual([])
})
