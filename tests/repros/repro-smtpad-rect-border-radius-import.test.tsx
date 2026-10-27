import { expect, test } from "bun:test"
import type { FootprintProp } from "@tscircuit/props"
import { type PcbSmtPad, pcb_smtpad } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Circuit JSON footprints retain both rectangular radius fields", async () => {
  const { circuit } = getTestFixture()
  const radiusCases = [
    { label: "border=0.5", rect_border_radius: 0.5 },
    { label: "border=0", rect_border_radius: 0 },
    { label: "no radius" },
    {
      label: "border=0.5, corner=0.25",
      rect_border_radius: 0.5,
      corner_radius: 0.25,
    },
  ]
  const pads: PcbSmtPad[] = radiusCases.flatMap((radiusCase, row) =>
    ["rect", "rotated_rect"].map((shape, column) =>
      pcb_smtpad.parse({
        ...radiusCase,
        type: "pcb_smtpad",
        pcb_smtpad_id: `pcb_smtpad_${row}_${column}`,
        shape,
        x: column * 10 - 5,
        y: 9 - row * 6,
        width: 3,
        height: 2,
        layer: "top",
        ccw_rotation: 30,
        port_hints: [`${row * 2 + column + 1}`],
      }),
    ),
  )

  circuit.add(
    <board width={24} height={30} schematicDisabled routingDisabled>
      {/* FootprintProp uses a legacy shape union; pads are schema-validated above. */}
      <chip name="U1" footprint={pads as FootprintProp} />
      <pcbnotetext
        text="Imported rect / rotated_rect: radius in mm"
        pcbY={13}
        fontSize={0.6}
      />
      {radiusCases.map((radiusCase, row) => (
        <pcbnotetext
          key={radiusCase.label}
          text={radiusCase.label}
          pcbY={6.5 - row * 6}
          fontSize={0.6}
        />
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_smtpad.list()).toMatchObject(
    radiusCases.flatMap(({ rect_border_radius, corner_radius }) => [
      { shape: "rect", width: 3, height: 2, rect_border_radius, corner_radius },
      {
        shape: "rotated_rect",
        width: 3,
        height: 2,
        ccw_rotation: 30,
        rect_border_radius,
        corner_radius,
      },
    ]),
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
