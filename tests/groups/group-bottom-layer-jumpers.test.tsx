import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("bottom-authored jumper footprints flip their component and pad layers together", async () => {
  const footprint = (
    <footprint originalLayer="bottom">
      <smtpad
        shape="rect"
        layer="bottom"
        width={1}
        height={0.7}
        pcbX={-1}
        portHints={["1"]}
      />
      <smtpad shape="circle" radius={0.4} pcbX={1} portHints={["2"]} />
    </footprint>
  )
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={22} height={12} schematicDisabled routingDisabled>
      <group layer="bottom">
        <jumper name="JP1" pinCount={2} footprint={footprint} pcbX={4} />
        <solderjumper name="JP2" pinCount={2} footprint={footprint} pcbX={-4} />
      </group>
      <pcbnotetext
        text="JP1 and JP2 pads follow their components to bottom"
        pcbY={4}
        fontSize={0.5}
      />
    </board>,
  )

  const { circuit: explicitFlip } = getTestFixture()
  explicitFlip.add(
    <board width={22} height={12} schematicDisabled routingDisabled>
      <group>
        <jumper
          name="JP1"
          pinCount={2}
          footprint={footprint}
          pcbX={-4}
          layer="bottom"
        />
        <solderjumper
          name="JP2"
          pinCount={2}
          footprint={footprint}
          pcbX={4}
          layer="bottom"
        />
      </group>
      <pcbnotetext
        text="JP1 and JP2 pads follow their components to bottom"
        pcbY={4}
        fontSize={0.5}
      />
    </board>,
  )

  explicitFlip.render()
  circuit.render()

  await expect(explicitFlip.getCircuitJson()).toMatchPcbSnapshot(
    import.meta.path,
  )
  expect(circuit.db.pcb_component.list().map(({ layer }) => layer)).toEqual([
    "bottom",
    "bottom",
  ])
  expect(circuit.db.pcb_smtpad.list()).toEqual(
    explicitFlip.db.pcb_smtpad.list(),
  )
  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
