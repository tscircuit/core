import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a trace crossing a narrow pour notch is not marked fully covered", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="14mm" height="8mm" schematicDisabled>
      <net name="GND" />
      <resistor name="R1" resistance="1k" footprint="0805" pcbX={-4} />
      <resistor name="R2" resistance="1k" footprint="0805" pcbX={4} />
      <trace path={[".R1 > .pin2", "net.GND", ".R2 > .pin1"]} pcbPath={[]} />
      <pcbnotetext
        pcbY={-3.4}
        fontSize={0.35}
        text="Trace crosses bare board at notch: no full-coverage tag"
      />
      <copperpour
        connectsTo="net.GND"
        layer="top"
        outline={[
          { x: -6, y: -3 },
          { x: 6, y: -3 },
          { x: 6, y: 3 },
          { x: -2, y: 3 },
          { x: -2, y: -1 },
          { x: -2.5, y: -1 },
          { x: -2.5, y: 3 },
          { x: -6, y: 3 },
        ]}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const [trace] = circuit.db.pcb_trace.list()
  expect(trace).toBeDefined()
  expect(trace!.route).toHaveLength(2)
  const wirePoints = trace!.route.filter((point) => point.route_type === "wire")
  expect(wirePoints).toHaveLength(2)
  // The notch lies between the old 0% and 25% samples of this route.
  expect(wirePoints[0]!.x).toBeLessThan(-2.5)
  expect(wirePoints[1]!.x).toBeGreaterThan(-2)
  for (const routePoint of trace!.route) {
    expect(routePoint).not.toHaveProperty("is_inside_copper_pour", true)
    expect(routePoint).not.toHaveProperty("copper_pour_id")
  }
  expect(circuit.db.pcb_copper_pour.list()).toHaveLength(1)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
