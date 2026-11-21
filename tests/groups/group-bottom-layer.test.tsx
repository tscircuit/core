import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a bottom-side group matches flipping each member about the group origin", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={40} height={30} schematicDisabled routingDisabled>
      <group name="control" pcbX={3} pcbY={-2} layer="bottom">
        <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} />
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0603"
          pcbX={5}
          pcbY={2}
          pcbRotation={90}
        />
        <capacitor
          name="C2"
          capacitance="1nF"
          footprint="0603"
          layer="bottom"
          pcbX={-4}
          pcbY={-3}
          pcbRotation={180}
        />
      </group>
      <pcbnotetext
        text="Bottom group: U1 and C1 on bottom, C2 on top"
        pcbY={9}
      />
    </board>,
  )

  const { circuit: explicitFlip } = getTestFixture()
  explicitFlip.add(
    <board width={40} height={30} schematicDisabled routingDisabled>
      <group name="control" pcbX={3} pcbY={-2}>
        <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} layer="bottom" />
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0603"
          layer="bottom"
          pcbX={-5}
          pcbY={2}
          pcbRotation={-90}
        />
        <capacitor
          name="C2"
          capacitance="1nF"
          footprint="0603"
          layer="top"
          pcbX={4}
          pcbY={-3}
          pcbRotation={-180}
        />
      </group>
      <pcbnotetext
        text="Bottom group: U1 and C1 on bottom, C2 on top"
        pcbY={9}
      />
    </board>,
  )

  explicitFlip.render()
  circuit.render()

  expect(circuit.db.pcb_smtpad.list()).toEqual(
    explicitFlip.db.pcb_smtpad.list(),
  )
  expect(circuit.db.pcb_component.list()).toEqual(
    explicitFlip.db.pcb_component.list(),
  )
  expect(circuit.db.cad_component.list()).toEqual(
    explicitFlip.db.cad_component.list(),
  )
  await expect(explicitFlip.getCircuitJson()).toMatchPcbSnapshot(
    import.meta.path,
  )
  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
