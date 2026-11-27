import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("component-relative hole and via positions make a group keep its authored placement", async () => {
  const members = (
    <>
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={4} />
      <hole diameter={0.9} pcbX="calc(R1.x + 2mm)" />
      <via
        fromLayer="top"
        toLayer="bottom"
        outerDiameter={0.75}
        holeDiameter={0.35}
        pcbX="calc(R1.x + 3mm)"
      />
    </>
  )
  const note = (
    <pcbnotetext
      text="Authored positions: R1 at 4 mm, hole at 6 mm, via at 7 mm"
      pcbY={4}
      fontSize={0.5}
    />
  )
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={22} height={12} schematicDisabled routingDisabled>
      <group name="calculated" layer="bottom">
        {members}
      </group>
      {note}
    </board>,
  )

  const { circuit: authored } = getTestFixture()
  authored.add(
    <board width={22} height={12} schematicDisabled routingDisabled>
      <group name="calculated">{members}</group>
      {note}
    </board>,
  )

  authored.render()
  circuit.render()

  await expect(authored.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
  expect(circuit.db.pcb_hole.list().map(({ x }) => x)).toEqual([6])
  expect(circuit.db.pcb_via.list().map(({ x }) => x)).toEqual([7])
  expect(circuit.db.pcb_component.list()).toEqual(
    authored.db.pcb_component.list(),
  )
  expect(circuit.db.source_property_ignored_warning.list()).toMatchObject([
    {
      property_name: "layer",
      message: expect.stringContaining(
        "Group calculated keeps its authored side",
      ),
    },
  ])
  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
