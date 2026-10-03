import { expect, test } from "bun:test"
import { pcb_plated_hole } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("circular holes with rectangular pads emit schema-valid Circuit JSON", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={10} routingDisabled schematicDisabled>
      {[
        { name: "J1", pcbX: -5, pcbRotation: 0 },
        { name: "J2", pcbX: 5, pcbRotation: 90 },
      ].map(({ name, pcbX, pcbRotation }) => (
        <chip
          key={name}
          name={name}
          pcbX={pcbX}
          pcbRotation={pcbRotation}
          pinLabels={{ pin1: ["IN"] }}
          footprint={
            <footprint>
              <platedhole
                portHints={["pin1"]}
                shape="circular_hole_with_rect_pad"
                holeDiameter={1}
                rectPadWidth={3}
                rectPadHeight={2}
              />
            </footprint>
          }
        />
      ))}
      <pcbnotetext
        text="Circular drill / rectangular pad"
        pcbY={3.5}
        fontSize={0.6}
      />
      <pcbnotetext text="J1: 0 degrees" pcbX={-5} pcbY={-2} fontSize={0.6} />
      <pcbnotetext text="J2: 90 degrees" pcbX={5} pcbY={-2} fontSize={0.6} />
    </board>,
  )

  circuit.render()

  const platedHoles = circuit.db.pcb_plated_hole.list()
  expect(platedHoles).toHaveLength(2)
  for (const platedHole of platedHoles) {
    // The emitter must include the shape discriminants required by consumers.
    expect(() => pcb_plated_hole.parse(platedHole)).not.toThrow()
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
