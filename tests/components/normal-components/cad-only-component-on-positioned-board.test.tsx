import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("CAD-only component uses its board-relative PCB position", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pcbX={60} pcbY={70} width={80} height={50}>
      <chip
        name="U1"
        pcbX={10}
        pcbY={20}
        footprint={<footprint />}
        cadModel={<cadmodel modelUrl="/model.step" stepUrl="/model.step" />}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbComponent = circuit.db.pcb_component.list()[0]
  const cadComponent = circuit.db.cad_component.list()[0]

  expect(pcbComponent.center).toEqual({ x: 70, y: 90 })
  expect(cadComponent.position).toEqual({ x: 70, y: 90, z: 0.7 })
})
