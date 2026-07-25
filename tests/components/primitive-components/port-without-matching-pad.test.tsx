import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const misconfiguredErrors = (circuit: any) =>
  circuit
    .getCircuitJson()
    .filter((e: any) => String(e.type).includes("misconfigured")) as any[]

test("a pinLabels entry with no matching pad is reported", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      {/* soic8 has 8 pads; pin99 has none. */}
      <chip
        name="U1"
        footprint="soic8"
        pcbX={5}
        pinLabels={{ pin1: ["A"], pin99: ["Z"] }}
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = misconfiguredErrors(circuit)

  // Previously this produced a 9th source_port with no pcb_port behind it and
  // no diagnostic; connecting to it only yielded a "trace is not connected"
  // error pointing at the trace instead of the bad pin label.
  expect(errors.length).toBe(1)
  expect(errors[0].message).toContain('Pin "Z"')
  expect(errors[0].message).toContain("U1")
  expect(errors[0].message).toContain("no matching pad")
  // The valid resistor must not be flagged.
  expect(errors[0].message).not.toContain("R1")
})

test("a component with no footprint at all is not flagged", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      {/* No footprint => no PCB primitives at all; every pin would otherwise
          be reported as having no matching pad. */}
      <solderjumper name="SJ1" pcbX={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(misconfiguredErrors(circuit)).toEqual([])
})

test("a fully valid footprint raises nothing", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic8"
        pcbX={5}
        pinLabels={{ pin1: ["VCC"], pin8: ["GND"] }}
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-8} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(misconfiguredErrors(circuit)).toEqual([])
})
