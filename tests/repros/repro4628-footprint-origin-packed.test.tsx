import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("packing preserves the authored origin under rotations and both PCB layers", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={32} routingDisabled schematicDisabled>
      <pcbnotetext
        text="Packed models: CAD crosses follow reference holes"
        pcbY={13}
        fontSize={0.55}
      />
      <group pcbX={3} pcbY={-2} pcbPack pcbGap={1}>
        {["top", "bottom"].map((layer) =>
          [0, 90, 180, 270].map((ccwRotationDegrees) => (
            <chip
              key={`${layer}_${ccwRotationDegrees}`}
              name={`${layer}_${ccwRotationDegrees}`}
              layer={layer as "top" | "bottom"}
              pcbRotation={ccwRotationDegrees}
              cadModel={{ stepUrl: "https://example.com/contact.step" }}
              footprint={
                <footprint>
                  <platedhole
                    shape="circle"
                    holeDiameter={0.78}
                    outerDiameter={1.3}
                    portHints={["1"]}
                  />
                  <smtpad
                    shape="circle"
                    radius={0.32}
                    pcbX={0.6}
                    pcbY={0.6}
                    layer="top"
                    portHints={["1"]}
                  />
                  <pcbnotetext
                    text={`${layer} ${ccwRotationDegrees}°`}
                    pcbY={-1.2}
                    fontSize={0.35}
                  />
                </footprint>
              }
            />
          )),
        )}
      </group>
    </board>,
  )
  circuit.render()
  for (const component of circuit.db.pcb_component.list()) {
    const hole = circuit.db.pcb_plated_hole
      .list()
      .find((hole) => hole.pcb_component_id === component.pcb_component_id)!
    const cad = circuit.db.cad_component
      .list()
      .find((cad) => cad.pcb_component_id === component.pcb_component_id)!
    expect(component.position_mode).toBe("packed")
    expect(cad.position.x).toBeCloseTo(hole.x)
    expect(cad.position.y).toBeCloseTo(hole.y)
    circuit.db.pcb_note_text.insert({
      text: "+",
      anchor_position: cad.position,
      anchor_alignment: "center",
      layer: "top",
      font: "tscircuit2024",
      font_size: 0.7,
    })
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
