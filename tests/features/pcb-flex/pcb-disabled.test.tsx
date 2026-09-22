import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("PCB-disabled rendering does not emit flex geometry", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board width={20} height={10} material="flex">
      <pcbbend
        x1={0}
        y1={-5}
        x2={0}
        y2={5}
        bendAngle={90}
        bendRadius={1}
        bendSide="right"
      />
      <pcbstiffener
        shape="rect"
        width={4}
        height={4}
        layer="bottom"
        material="fr4"
        thickness={0.2}
      />
      <resistor name="R1" resistance="1k" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_bend.list()).toHaveLength(0)
  expect(circuit.db.pcb_stiffener.list()).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
