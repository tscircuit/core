import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("padless chips and jumpers keep their PCB and CAD centers at the flipped footprint origin", async () => {
  const footprint = (
    <footprint>
      <silkscreenrect width={2} height={1} />
    </footprint>
  )
  const note = (
    <pcbnotetext
      text="U1, JP1 and JP2: padless footprints flip to X = -4 mm"
      pcbY={8}
      fontSize={0.5}
    />
  )
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={24}
      height={22}
      thickness={2}
      schematicDisabled
      routingDisabled
    >
      <group layer="bottom">
        <chip name="U1" footprint={footprint} pcbX={4} />
        <jumper
          name="JP1"
          pinCount={2}
          footprint={footprint}
          pcbX={4}
          pcbY={4}
        />
        <solderjumper
          name="JP2"
          pinCount={2}
          footprint={footprint}
          pcbX={4}
          pcbY={-4}
        />
      </group>
      {note}
    </board>,
  )

  const { circuit: explicitFlip } = getTestFixture()
  explicitFlip.add(
    <board
      width={24}
      height={22}
      thickness={2}
      schematicDisabled
      routingDisabled
    >
      <group>
        <chip name="U1" footprint={footprint} pcbX={-4} layer="bottom" />
        <jumper
          name="JP1"
          pinCount={2}
          footprint={footprint}
          pcbX={-4}
          pcbY={4}
          layer="bottom"
        />
        <solderjumper
          name="JP2"
          pinCount={2}
          footprint={footprint}
          pcbX={-4}
          pcbY={-4}
          layer="bottom"
        />
      </group>
      {note}
    </board>,
  )

  explicitFlip.render()
  circuit.render()

  await expect(explicitFlip.getCircuitJson()).toMatchPcbSnapshot(
    import.meta.path,
  )
  expect(circuit.db.pcb_component.list()).toEqual(
    explicitFlip.db.pcb_component.list(),
  )
  expect(circuit.db.cad_component.list()).toEqual(
    explicitFlip.db.cad_component.list(),
  )
  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
