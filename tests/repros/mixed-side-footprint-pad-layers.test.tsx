import { expect, test } from "bun:test"
import type { SmtPadProps } from "@tscircuit/props"
import type { SmtPad } from "lib/components/primitive-components/SmtPad"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("mixed-side footprints preserve pad, port, and paste layers", async () => {
  const { circuit } = getTestFixture()
  const shapes: SmtPadProps[] = [
    { shape: "rect", width: 1.2, height: 0.8 },
    { shape: "rotated_rect", width: 1.2, height: 0.8, ccwRotation: 30 },
    { shape: "circle", radius: 0.5 },
    { shape: "pill", width: 1.2, height: 0.8, radius: 0.4 },
    {
      shape: "rotated_pill",
      width: 1.2,
      height: 0.8,
      radius: 0.4,
      ccwRotation: 30,
    },
    {
      shape: "polygon",
      points: [
        { x: -0.6, y: -0.4 },
        { x: 0.6, y: -0.4 },
        { x: 0, y: 0.4 },
      ],
    },
  ]
  const placements = [
    {
      originalLayer: "top",
      layer: undefined,
      expectedLayers: ["top", "bottom"],
    },
    { originalLayer: "top", layer: "top", expectedLayers: ["top", "bottom"] },
    {
      originalLayer: "top",
      layer: "bottom",
      expectedLayers: ["bottom", "top"],
    },
    {
      originalLayer: "bottom",
      layer: undefined,
      expectedLayers: ["top", "bottom"],
    },
    {
      originalLayer: "bottom",
      layer: "top",
      expectedLayers: ["bottom", "top"],
    },
    {
      originalLayer: "bottom",
      layer: "bottom",
      expectedLayers: ["top", "bottom"],
    },
  ] as const
  const rotations = [0, 90, 180, 270, 30, 0]

  circuit.add(
    <board width={52} height={34} routingDisabled schematicDisabled>
      <pcbnotetext
        text="Mixed-side footprints: pin1 authored TOP, pin2 authored BOTTOM"
        pcbY={15}
        fontSize={0.7}
      />
      {shapes.map((shape, shapeIndex) => (
        <Fragment key={shape.shape}>
          <pcbnotetext
            text={shape.shape}
            pcbX={-6 + shapeIndex * 5.5}
            pcbY={12.5}
            fontSize={0.5}
          />
        </Fragment>
      ))}
      {placements.map((placement, placementIndex) => (
        <Fragment key={`${placement.originalLayer}_${placement.layer}`}>
          <pcbnotetext
            text={`orig ${placement.originalLayer} / layer ${placement.layer ?? "omitted"}`}
            pcbX={-17}
            pcbY={10 - placementIndex * 4.5}
            fontSize={0.6}
          />
          {shapes.map((shape, shapeIndex) => (
            <chip
              key={shape.shape}
              name={`U${placementIndex + 1}_${shapeIndex + 1}`}
              layer={placement.layer}
              isSmt
              pcbX={-6 + shapeIndex * 5.5}
              pcbY={10 - placementIndex * 4.5}
              pcbRotation={rotations[shapeIndex]}
              footprint={
                <footprint originalLayer={placement.originalLayer}>
                  <smtpad
                    {...shape}
                    layer="top"
                    pcbX={-1.1}
                    portHints={["pin1"]}
                  />
                  <smtpad
                    {...shape}
                    layer="bottom"
                    pcbX={1.1}
                    portHints={["pin2"]}
                  />
                </footprint>
              }
            />
          ))}
        </Fragment>
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()

  // Capture both sides before checking layers so a regression preserves
  // visual evidence of pads that collapse onto the wrong side.
  for (const layer of ["top", "bottom"] as const) {
    await expect(circuit).toMatchPcbSnapshot(
      import.meta.path.replace(".test.tsx", `-${layer}.test.tsx`),
      { layer, showSolderPaste: true },
    )
  }

  const actualLayers = placements.flatMap((placement, placementIndex) =>
    shapes.map((shape, shapeIndex) => {
      const name = `U${placementIndex + 1}_${shapeIndex + 1}`
      const pads = ["pin1", "pin2"].map((pin) => {
        const smtpad = circuit.selectOne(`.${name} smtpad.${pin}`) as SmtPad
        const pad = circuit.db.pcb_smtpad.get(smtpad.pcb_smtpad_id!)!
        return {
          pad: pad.layer,
          available: smtpad.getAvailablePcbLayers(),
          port: circuit.db.pcb_port.get(pad.pcb_port_id!)!.layers,
          paste: circuit.db.pcb_solder_paste
            .list()
            .filter((paste) => paste.pcb_smtpad_id === pad.pcb_smtpad_id)
            .map((paste) => paste.layer),
        }
      })
      return { name, shape: shape.shape, pads }
    }),
  )
  const expectedLayers = placements.flatMap((placement, placementIndex) =>
    shapes.map((shape, shapeIndex) => ({
      name: `U${placementIndex + 1}_${shapeIndex + 1}`,
      shape: shape.shape,
      pads: placement.expectedLayers.map((layer) => ({
        pad: layer,
        available: [layer],
        port: [layer],
        paste: [layer],
      })),
    })),
  )
  expect(actualLayers).toEqual(expectedLayers)
})
