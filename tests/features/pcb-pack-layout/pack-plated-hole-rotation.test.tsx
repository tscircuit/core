import { expect, test } from "bun:test"
import type {
  PcbHoleCircularWithRectPad,
  PcbHoleRotatedPillWithRectPad,
  PcbPlatedHoleOval,
} from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pack-applied rotation propagates to pcb_plated_hole rotation fields", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="40mm" routingDisabled>
      <group name="G1">
        <chip
          name="U1"
          footprint={
            <footprint>
              {/* Pill plated hole */}
              <platedhole
                name="H1"
                shape="pill"
                outerWidth="1.2mm"
                outerHeight="2.0mm"
                holeWidth="0.8mm"
                holeHeight="1.6mm"
                pcbX={-2}
                pcbY={0}
                portHints={["pin1"]}
              />
              {/* Circular hole with rect pad */}
              <platedhole
                name="H2"
                shape="circular_hole_with_rect_pad"
                holeDiameter="0.8mm"
                rectPadWidth="1.5mm"
                rectPadHeight="2.5mm"
                pcbX={0}
                pcbY={0}
                portHints={["pin2"]}
              />
              {/* Pill hole with rect pad */}
              <platedhole
                name="H3"
                shape="pill_hole_with_rect_pad"
                holeWidth="0.8mm"
                holeHeight="1.6mm"
                rectPadWidth="1.5mm"
                rectPadHeight="2.5mm"
                pcbX={2}
                pcbY={0}
                portHints={["pin3"]}
              />
            </footprint>
          }
        />
        <chip
          name="U2"
          isSmt
          footprint={
            <footprint>
              <platedhole
                name="H4"
                shape="pill"
                outerWidth="1.2mm"
                outerHeight="2.0mm"
                holeWidth="0.8mm"
                holeHeight="1.6mm"
                pcbX={0}
                pcbY={0}
                portHints={["pin1"]}
              />
            </footprint>
          }
        />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const group = circuit.selectOne("group") as any
  const pcbComponents = circuit.db.pcb_component.list()
  const pcbComponent1 = pcbComponents.find(
    (c) =>
      circuit.db.source_component.get(c.source_component_id)?.name === "U1",
  )!
  const pcbComponent2 = pcbComponents.find(
    (c) =>
      circuit.db.source_component.get(c.source_component_id)?.name === "U2",
  )!

  // Simulate pack output with 90-degree CCW rotation
  const { applyPackOutput } = await import(
    "lib/components/primitive-components/Group/Group_doInitialPcbLayoutPack/applyPackOutput"
  )

  applyPackOutput(
    group,
    {
      components: [
        {
          componentId: pcbComponent1.pcb_component_id,
          center: { x: 5, y: 5 },
          ccwRotationDegrees: 90,
          width: pcbComponent1.width,
          height: pcbComponent1.height,
        } as any,
        {
          componentId: pcbComponent2.pcb_component_id,
          center: { x: -5, y: -5 },
          ccwRotationDegrees: 90,
          width: pcbComponent2.width,
          height: pcbComponent2.height,
        } as any,
      ],
    } as any,
    {},
    { components: [] } as any,
  )

  const u1Holes = circuit.db.pcb_plated_hole
    .list()
    .filter((h) => h.pcb_component_id === pcbComponent1.pcb_component_id)
  const pillHole = u1Holes.find((h) =>
    h.port_hints?.includes("pin1"),
  ) as PcbPlatedHoleOval
  const circRectHole = u1Holes.find((h) =>
    h.port_hints?.includes("pin2"),
  ) as PcbHoleCircularWithRectPad
  const pillRectHole = u1Holes.find((h) =>
    h.port_hints?.includes("pin3"),
  ) as PcbHoleRotatedPillWithRectPad

  expect(pillHole).toBeDefined()
  expect(pillHole.ccw_rotation).toBe(90)

  expect(circRectHole).toBeDefined()
  expect(circRectHole.rect_ccw_rotation).toBe(90)

  expect(pillRectHole).toBeDefined()
  expect(pillRectHole.hole_ccw_rotation).toBe(90)
  expect(pillRectHole.rect_ccw_rotation).toBe(90)

  // SMT chip with plated hole generates solder paste that must also rotate
  const paste = circuit.db.pcb_solder_paste
    .list()
    .filter((p) => p.pcb_component_id === pcbComponent2.pcb_component_id)
  const pillPaste = paste.filter((p) => p.shape === "rotated_pill")
  expect(pillPaste.length).toBeGreaterThanOrEqual(1)
  for (const p of pillPaste) {
    expect((p as any).ccw_rotation).toBe(90)
  }
})

test("pack rotation keeps hole oriented clearance consistent with component", async () => {
  const { circuit } = getTestFixture()

  // Footprint modeled after USB-C with pill shield holes and adjacent SMT pad
  circuit.add(
    <board width="50mm" height="50mm" routingDisabled>
      <group name="G1">
        <chip
          name="J1"
          footprint={
            <footprint>
              {/* Outer 1.2 x 2.0 mm pill hole at (-2.831, -9.894) */}
              <platedhole
                name="SH1"
                shape="pill"
                outerWidth="1.2mm"
                outerHeight="2.0mm"
                holeWidth="0.8mm"
                holeHeight="1.6mm"
                pcbX={-2.831}
                pcbY={-9.894}
                portHints={["SH1"]}
              />
              {/* SMT pad that clears the hole when rotated together */}
              <smtpad
                shape="rect"
                width="1.3mm"
                height="0.6mm"
                pcbX={-3.6}
                pcbY={-8.77}
                portHints={["pin1"]}
              />
            </footprint>
          }
        />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const group = circuit.selectOne("group") as any
  const pcbComponent = circuit.db.pcb_component.list()[0]

  const { applyPackOutput } = await import(
    "lib/components/primitive-components/Group/Group_doInitialPcbLayoutPack/applyPackOutput"
  )

  // Rotate component by 90 degrees CCW via pack
  applyPackOutput(
    group,
    {
      components: [
        {
          componentId: pcbComponent.pcb_component_id,
          center: { x: 10, y: 10 },
          ccwRotationDegrees: 90,
          width: pcbComponent.width,
          height: pcbComponent.height,
        } as any,
      ],
    } as any,
    {},
    { components: [] } as any,
  )

  const hole = circuit.db.pcb_plated_hole.list()[0] as PcbPlatedHoleOval
  expect(hole.ccw_rotation).toBe(90)
})
