import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic auto-layout separates groups nested under separate PCB groups (#5573)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={25} height={15} schAutoLayoutEnabled>
      <schematicsheet name="main" sheetIndex={1} />
      <group name="Left" pcbX={-6} schAutoLayoutEnabled>
        <group name="A" schSheetName="main" schAutoLayoutEnabled>
          <resistor name="R1" resistance="1k" schSheetName="main" />
        </group>
      </group>
      <group name="Right" pcbX={6} schAutoLayoutEnabled>
        <group name="B" schSheetName="main" schAutoLayoutEnabled>
          <resistor name="R2" resistance="1k" schSheetName="main" />
        </group>
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicComponents = circuit.db.schematic_component.list()
  expect(schematicComponents).toHaveLength(2)

  const [c1, c2] = schematicComponents
  const dx = Math.abs(c1!.center.x - c2!.center.x)
  const dy = Math.abs(c1!.center.y - c2!.center.y)
  expect(dx + dy).toBeGreaterThan(1)
})
