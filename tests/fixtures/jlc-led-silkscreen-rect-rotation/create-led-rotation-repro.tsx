import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { G3535N1UVS8U06_365NM } from "./g3535n1uvs8u06-365nm"
import { HL_C3535F3V3EA_ZW } from "./hl-c3535f3v3ea-zw"
import { HL_C3535F4IR3EA_ZW } from "./hl-c3535f4ir3ea-zw"
import { HL_C3535F4IR3GA_ZW } from "./hl-c3535f4ir3ga-zw"
import { HL_C3535F5R3EA_ZW } from "./hl-c3535f5r3ea-zw"

export const ledFootprints = [
  { partNumber: "C540987", Component: HL_C3535F5R3EA_ZW },
  { partNumber: "C540985", Component: HL_C3535F3V3EA_ZW },
  { partNumber: "C540986", Component: HL_C3535F4IR3EA_ZW },
  { partNumber: "C5445085", Component: HL_C3535F4IR3GA_ZW },
  { partNumber: "C2915611", Component: G3535N1UVS8U06_365NM },
] as const

const rotations = [0, 45, 90, 180, 270] as const

export function createLedRotationRepro(layer: "top" | "bottom") {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={96} height={82} routingDisabled>
      <pcbnotetext
        text={`JLC LED rectangles / ${layer}: 45deg pads rotate, silk stays square`}
        pcbY={37}
        fontSize={0.8}
      />
      {rotations.map((rotation, column) => (
        <Fragment key={`heading-${rotation}`}>
          <pcbnotetext
            text={`${rotation}deg`}
            pcbX={-24 + column * 14}
            pcbY={32}
            fontSize={0.9}
          />
        </Fragment>
      ))}
      {ledFootprints.map(({ partNumber, Component }, row) => (
        <Fragment key={partNumber}>
          <pcbnotetext
            text={partNumber}
            pcbX={-41}
            pcbY={24 - row * 12}
            fontSize={0.9}
          />
          {rotations.map((rotation, column) => (
            <Component
              key={`${partNumber}-${rotation}`}
              name={`U${row * rotations.length + column + 1}`}
              layer={layer}
              pcbX={-24 + column * 14}
              pcbY={24 - row * 12}
              pcbRotation={rotation}
            />
          ))}
        </Fragment>
      ))}
    </board>,
  )
  circuit.render()
  return circuit
}

/**
 * Compare square rectangle and pad axes in board-world XY (mm, +X right,
 * +Y top, CCW angles about +Z). The rectangle baseline and pad baseline are
 * unoriented directions; square symmetry makes orientations equivalent modulo
 * 90deg. Derive the expected angle from emitted pad geometry, not parent props.
 */
export function getLedRectangleRotationMismatches(
  circuit: ReturnType<typeof createLedRotationRepro>,
  layer: "top" | "bottom",
) {
  const normalizeSquareAxis = (angle: number) =>
    Math.round((((angle % 90) + 90) % 90) * 1e6) / 1e6

  return ledFootprints.flatMap(({ partNumber }, row) => {
    const componentName = `U${row * rotations.length + 2}`
    const sourceComponent = circuit.db.source_component
      .list()
      .find((source) => source.name === componentName)!
    const pcbComponent = circuit.db.pcb_component
      .list()
      .find(
        (pcb) =>
          pcb.source_component_id === sourceComponent.source_component_id,
      )!
    const rectangle = circuit.db.pcb_silkscreen_rect
      .list()
      .find((rect) => rect.pcb_component_id === pcbComponent.pcb_component_id)!
    const pad = circuit.db.pcb_smtpad
      .list()
      .find(
        (smtpad) =>
          smtpad.pcb_component_id === pcbComponent.pcb_component_id &&
          smtpad.shape === "rotated_rect",
      )!
    if (pad.shape !== "rotated_rect") {
      throw new Error(`Expected a rotated pad on ${componentName}`)
    }
    const padAxisDegrees = normalizeSquareAxis(pad.ccw_rotation)
    const rectangleAxisDegrees = normalizeSquareAxis(
      rectangle.ccw_rotation ?? 0,
    )
    return Math.abs(padAxisDegrees - rectangleAxisDegrees) < 1e-6
      ? []
      : [
          {
            partNumber,
            layer,
            componentName,
            padAxisDegrees,
            rectangleAxisDegrees,
          },
        ]
  })
}
