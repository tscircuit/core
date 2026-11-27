import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a rotated bottom-side group mirrors members before applying its rotation", async () => {
  const footprint = (
    <footprint>
      <smtpad shape="rect" width={1} height={0.5} pcbX={-1} portHints={["1"]} />
      <smtpad shape="circle" radius={0.4} pcbY={1} portHints={["2"]} />
    </footprint>
  )

  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={18} schematicDisabled routingDisabled>
      <group pcbX={3} pcbY={-2} pcbRotation={30} layer="bottom">
        <chip
          name="U1"
          footprint={footprint}
          layer="bottom"
          pcbX={4}
          pcbY={2}
          pcbRotation={270}
        />
      </group>
      <pcbnotetext
        text="U1 flips to top before the group rotates 30 degrees"
        pcbY={6}
      />
    </board>,
  )

  const { circuit: explicitFlip } = getTestFixture()
  explicitFlip.add(
    <board width={24} height={18} schematicDisabled routingDisabled>
      <group pcbX={3} pcbY={-2} pcbRotation={30}>
        <chip
          name="U1"
          footprint={footprint}
          layer="top"
          pcbX={-4}
          pcbY={2}
          pcbRotation={-270}
        />
      </group>
      <pcbnotetext
        text="U1 flips to top before the group rotates 30 degrees"
        pcbY={6}
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
  await expect(explicitFlip.getCircuitJson()).toMatchPcbSnapshot(
    import.meta.path,
  )
  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
