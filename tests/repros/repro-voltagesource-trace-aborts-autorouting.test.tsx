import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a trace to a voltagesource without pcb_ports does not abort PCB autorouting for other traces", async () => {
  const { circuit } = getTestFixture()

  const errors: unknown[][] = []
  const origConsoleError = console.error
  console.error = (...args: unknown[]) => {
    errors.push(args)
  }

  try {
    circuit.add(
      <board width="20mm" height="20mm">
        <voltagesource
          name="V1"
          voltage="5V"
          footprint="0402"
          pcbX={-4}
          pcbY={0}
        />
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={0}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={4}
          pcbY={0}
        />
        <trace from=".V1 > .pin1" to=".R1 > .pin1" />
        <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      </board>,
    )

    await circuit.renderUntilSettled()
  } finally {
    console.error = origConsoleError
  }

  const v1PcbComponent = circuit.db.pcb_component
    .list()
    .find(
      (c) =>
        circuit.db.source_component.get(c.source_component_id)?.name === "V1",
    )
  expect(v1PcbComponent).toBeDefined()
  expect(
    circuit.db.pcb_port
      .list()
      .filter((p) => p.pcb_component_id === v1PcbComponent!.pcb_component_id),
  ).toHaveLength(0)

  const undefinedPortCrash = errors
    .flat()
    .find((arg) => String(arg).includes("connectedPort.x"))
  expect(undefinedPortCrash).toBeUndefined()

  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
})
