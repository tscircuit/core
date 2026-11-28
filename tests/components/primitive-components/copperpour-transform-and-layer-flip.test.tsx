import { expect, test } from "bun:test"
import type { PcbCopperPourBRep } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const ASYMMETRIC_POUR_OUTLINE = [
  { x: -0.5, y: -0.5 },
  { x: 2.7, y: -0.5 },
  { x: 2.7, y: 1.7 },
  { x: -0.5, y: 1.7 },
]

const PourPadChip = (props: {
  name: string
  label: string
  pcbX: number
  pcbY: number
  pcbRotation: number
  layer: "top" | "bottom"
}) => (
  <>
    <chip
      name={props.name}
      pcbX={props.pcbX}
      pcbY={props.pcbY}
      pcbRotation={props.pcbRotation}
      layer={props.layer}
      connections={{ pin1: "net.GND" }}
      footprint={
        <footprint>
          <smtpad
            shape="rect"
            portHints={["pin1"]}
            pcbX={1.8}
            pcbY={0.9}
            width={0.7}
            height={0.7}
          />
          <copperpour
            connectsTo="net.GND"
            layer="top"
            clearance="0.15mm"
            boardEdgeMargin="0.15mm"
            outline={ASYMMETRIC_POUR_OUTLINE}
          />
        </footprint>
      }
    />
    <pcbnotetext
      text={props.label}
      pcbX={props.pcbX}
      pcbY={props.pcbY + 3.6}
      fontSize="0.5mm"
    />
  </>
)

test("copperpour outline and layer follow 0/90/180/270 rotation and bottom-layer flip", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="48mm" height="28mm" routingDisabled>
      <net name="GND" />

      <PourPadChip
        name="U_T0"
        label="TOP 0 deg"
        pcbX={-18}
        pcbY={5}
        pcbRotation={0}
        layer="top"
      />
      <PourPadChip
        name="U_T90"
        label="TOP 90 deg"
        pcbX={-6}
        pcbY={5}
        pcbRotation={90}
        layer="top"
      />
      <PourPadChip
        name="U_T180"
        label="TOP 180 deg"
        pcbX={6}
        pcbY={5}
        pcbRotation={180}
        layer="top"
      />
      <PourPadChip
        name="U_T270"
        label="TOP 270 deg"
        pcbX={18}
        pcbY={5}
        pcbRotation={270}
        layer="top"
      />

      <PourPadChip
        name="U_B0"
        label="BOT 0 deg"
        pcbX={-18}
        pcbY={-7}
        pcbRotation={0}
        layer="bottom"
      />
      <PourPadChip
        name="U_B90"
        label="BOT 90 deg"
        pcbX={-6}
        pcbY={-7}
        pcbRotation={90}
        layer="bottom"
      />
      <PourPadChip
        name="U_B180"
        label="BOT 180 deg"
        pcbX={6}
        pcbY={-7}
        pcbRotation={180}
        layer="bottom"
      />
      <PourPadChip
        name="U_B270"
        label="BOT 270 deg"
        pcbX={18}
        pcbY={-7}
        pcbRotation={270}
        layer="bottom"
      />

      <pcbnotetext
        text="Asymmetric footprint copperpour follows pad across 0/90/180/270 deg on top and bottom"
        pcbX={0}
        pcbY={11.8}
        fontSize="0.55mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceComponents = circuit.db.source_component.list()
  const pcbComponents = circuit.db.pcb_component.list()
  const pcbSmtPads = circuit.db.pcb_smtpad.list()
  const copperPours = circuit.db.pcb_copper_pour
    .list()
    .filter((pour): pour is PcbCopperPourBRep => pour.shape === "brep")

  expect(copperPours).toHaveLength(8)

  for (const sourceComponent of sourceComponents) {
    const pcbComponent = pcbComponents.find(
      (candidate) =>
        candidate.source_component_id === sourceComponent.source_component_id,
    )!
    const pad = pcbSmtPads.find(
      (candidate) =>
        candidate.pcb_component_id === pcbComponent.pcb_component_id,
    )!
    expect(pad.shape).toBe("rect")
    if (pad.shape !== "rect") continue

    const enclosingPour = copperPours.find((pour) => {
      const vertices = pour.brep_shape.outer_ring.vertices
      const minX = Math.min(...vertices.map((vertex) => vertex.x))
      const maxX = Math.max(...vertices.map((vertex) => vertex.x))
      const minY = Math.min(...vertices.map((vertex) => vertex.y))
      const maxY = Math.max(...vertices.map((vertex) => vertex.y))
      return (
        pour.layer === pad.layer &&
        pad.x > minX &&
        pad.x < maxX &&
        pad.y > minY &&
        pad.y < maxY
      )
    })

    expect(enclosingPour).toBeDefined()
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
