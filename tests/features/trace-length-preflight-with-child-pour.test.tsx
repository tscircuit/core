import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a child subcircuit's GND pour does not exempt the parent's GND trace", async () => {
  const { circuit } = getTestFixture()
  let autoroutingStartCount = 0
  circuit.on("autorouting:start", () => autoroutingStartCount++)

  circuit.add(
    <board width="20mm" height="12mm" layers={4} autorouter="auto-local">
      <pcbnotetext
        pcbY={-4}
        fontSize={0.7}
        text="CHILD GND IS A DIFFERENT NET"
      />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0603"
        pcbX={-4}
        connections={{ pin1: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0603"
        pcbX={4}
        connections={{ pin1: "net.GND" }}
      />
      <trace
        name="ground_feed"
        from=".R1 > .pin1"
        to="net.GND"
        maxLength="2mm"
      />
      <subcircuit name="child" pcbY={3} width={4} height={2} routingDisabled>
        <copperpour
          layer="inner1"
          connectsTo="net.GND"
          outline={[
            { x: -2, y: 2 },
            { x: 2, y: 2 },
            { x: 2, y: 4 },
            { x: -2, y: 4 },
          ]}
          unbroken
        />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(autoroutingStartCount).toBe(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(
    circuit.db.source_net.list().filter((net) => net.name === "GND"),
  ).toHaveLength(2)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(1)
  expect(circuit.db.pcb_autorouting_error.list()[0].message).toContain(
    "cannot be satisfied",
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
})
