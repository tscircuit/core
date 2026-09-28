import { expect, test } from "bun:test"
import { pcb_hole, pcb_plated_hole } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board-level holes omit absent owners while footprint holes retain their owner", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={24} height={16} routingDisabled schematicDisabled>
      <hole diameter={1} pcbX={-6} pcbY={2} />
      <platedhole
        shape="circle"
        outerDiameter={2}
        holeDiameter={1}
        pcbX={-6}
        pcbY={-2}
      />
      <chip
        name="J1"
        pcbX={6}
        pinLabels={{ pin1: ["IN"] }}
        footprint={
          <footprint>
            <hole diameter={1} pcbY={2} />
            <platedhole
              portHints={["pin1"]}
              shape="circle"
              outerDiameter={2}
              holeDiameter={1}
              pcbY={-2}
            />
          </footprint>
        }
      />
      <pcbnotetext text="Board: no owner" pcbX={-6} pcbY={5} fontSize={0.7} />
      <pcbnotetext
        text="Footprint: J1 owner"
        pcbX={6}
        pcbY={5}
        fontSize={0.7}
      />
      <pcbnotetext text="Non-plated" pcbY={2} fontSize={0.6} />
      <pcbnotetext text="Plated" pcbY={-2} fontSize={0.6} />
    </board>,
  )

  circuit.render()

  const pcbComponents = circuit.db.pcb_component.list()
  expect(pcbComponents).toHaveLength(1)

  for (const { schema, holes } of [
    { schema: pcb_hole, holes: circuit.db.pcb_hole.list() },
    { schema: pcb_plated_hole, holes: circuit.db.pcb_plated_hole.list() },
  ]) {
    expect(holes).toHaveLength(2)
    for (const hole of holes) {
      // A null owner fails the consumer schema even when the geometry is valid.
      expect(() => schema.parse(hole)).not.toThrow()
    }

    const boardHole = holes.find((hole) => hole.x === -6)!
    const footprintHole = holes.find((hole) => hole.x === 6)!
    expect(JSON.parse(JSON.stringify(boardHole))).not.toHaveProperty(
      "pcb_component_id",
    )
    expect(footprintHole.pcb_component_id).toBe(
      pcbComponents[0]!.pcb_component_id,
    )
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
