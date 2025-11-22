import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("pcbStraightLine draws a direct pcb trace between two ports", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={5} pcbY={0} />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        pcbStraightLine
        thickness={0.3}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = await circuit.getCircuitJson()
  const pcbTraces = circuitJson.filter(
    (element: any) => element.type === "pcb_trace",
  ) as any[]

  expect(pcbTraces).toHaveLength(1)
  expect(pcbTraces[0].route.length).toBe(2)
  expect(
    pcbTraces[0].route.every((point: any) => point.route_type === "wire"),
  ).toBe(true)

  expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
})
