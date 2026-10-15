import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rounded board outline moves with pcbX and pcbY", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={10} height={10} pcbX={10} pcbY={-10} borderRadius={1}>
      <chip name="U1" footprint="0402" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  expect(
    circuitJson.find((element) => element.type === "pcb_board"),
  ).toMatchObject({
    center: { x: 10, y: -10 },
    width: 10,
    height: 10,
    // The rounded outline spans x=5..15 and y=-15..-5.
    outline: expect.arrayContaining([
      { x: 6, y: -15 },
      { x: 14, y: -15 },
      { x: 15, y: -14 },
      { x: 15, y: -6 },
      { x: 14, y: -5 },
      { x: 6, y: -5 },
      { x: 5, y: -6 },
      { x: 5, y: -14 },
    ]),
  })
  expect(
    circuitJson.find((element) => element.type === "pcb_component"),
  ).toMatchObject({
    center: { x: 10, y: -10 },
  })
  expect(
    circuitJson.filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
})
