import { expect, test } from "bun:test"
import type { PcbTraceRoutePoint } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an existing diagonal copper segment can be an obstacle for the next routing pass", async () => {
  const { circuit } = getTestFixture()
  const failures: string[] = []
  circuit.on("asyncEffect:end", (event) => {
    if (event.error) failures.push(String(event.error))
  })
  const fixedRoute = [
    { route_type: "wire", layer: "top", width: 0.4, x: -2, y: -1 },
    { route_type: "wire", layer: "top", width: 0.4, x: 0, y: 1 },
  ] satisfies PcbTraceRoutePoint[]
  circuit.add(
    <board width={20} height={12} schematicDisabled autorouter="auto_local">
      <resistor name="R1" resistance={100} footprint="0402" pcbX={-5} />
      <resistor name="R2" resistance={100} footprint="0402" pcbX={5} />
      <chip
        name="FIXED"
        pcbY={3}
        footprint={
          <footprint>
            <pcbtrace route={fixedRoute} />
          </footprint>
        }
      />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <pcbnotetext
        pcbY={-3}
        text="Fixed 45 deg copper above R1-R2"
        fontSize={0.55}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect({
    diagonalError: failures.some((error) =>
      error.includes("only supports horizontal and vertical"),
    ),
    traceCount: circuit.db.pcb_trace.list().length,
  }).toMatchSnapshot()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
