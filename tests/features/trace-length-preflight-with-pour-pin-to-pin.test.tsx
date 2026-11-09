import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a ground pour does not exempt an impossible pin-to-pin trace", async () => {
  const { circuit } = getTestFixture()
  let autoroutingStartCount = 0
  circuit.on("autorouting:start", () => autoroutingStartCount++)

  circuit.add(
    <board width="20mm" height="12mm" layers={4} autorouter="auto-local">
      <pcbnotetext
        pcbY={-4}
        fontSize={0.7}
        text="2mm PIN-TO-PIN LIMIT STILL APPLIES"
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
        name="ground_link"
        from=".R1 > .pin1"
        to=".R2 > .pin1"
        maxLength="2mm"
      />
      <copperpour layer="inner1" connectsTo="net.GND" unbroken />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(autoroutingStartCount).toBe(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(1)
  expect(circuit.db.pcb_autorouting_error.list()[0].message).toContain(
    "8.00mm apart",
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
})
