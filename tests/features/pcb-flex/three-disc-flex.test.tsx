import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { pcb_bend, pcb_stiffener } from "circuit-json"

const radius = 6
const pitch = 22
const neckHalfWidth = 1.25
const alpha = Math.asin(neckHalfWidth / radius)
const arc = (cx: number, from: number, to: number) => {
  const count = Math.ceil((to - from) / (Math.PI / 48))
  return Array.from({ length: count + 1 }, (_, i) => ({
    x: cx + radius * Math.cos(from + ((to - from) * i) / count),
    y: radius * Math.sin(from + ((to - from) * i) / count),
  }))
}

// Circuit JSON: right-handed, +Z above the board, millimeters. Two opposite
// U-folds (four quarter turns) stack the three discs 6 mm apart.
const copperRoutes = [-0.55, 0, 0.55].map((y) => [
  {
    route_type: "wire" as const,
    x: -25,
    y,
    width: 0.18,
    layer: "top" as const,
  },
  { route_type: "wire" as const, x: 25, y, width: 0.18, layer: "top" as const },
])

const bendSpacing = 6 + Math.PI / 2 - 2
const a = (pitch - bendSpacing) / 2
const b = (pitch + bendSpacing) / 2

test("TSX flex board stacks three discs with four bends and bonded stiffeners", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      material="flex"
      thickness={0.15}
      width={56}
      height={12}
      pcbX={22}
      solderMaskColor="#cc9b32"
      schematicDisabled
      routingDisabled
      outline={[
        ...arc(0, alpha, 2 * Math.PI - alpha),
        ...arc(pitch, Math.PI + alpha, 2 * Math.PI - alpha),
        ...arc(2 * pitch, Math.PI + alpha, 3 * Math.PI - alpha),
        ...arc(pitch, alpha, Math.PI - alpha),
      ]}
    >
      {[a, b, pitch + a, pitch + b].map((x, i) => (
        <pcbbend
          key={i}
          name={`B${i + 1}`}
          x1={x - pitch}
          y1={-neckHalfWidth}
          x2={x - pitch}
          y2={neckHalfWidth}
          bendAngle={i < 2 ? 90 : -90}
          bendRadius="1mm"
          bendSide="right"
        />
      ))}
      {[0, 1, 2].map((i) => (
        <group key={i} pcbX={(i - 1) * pitch}>
          <pcbstiffener
            name={`S${i + 1}`}
            shape="polygon"
            layer="bottom"
            material="fr4"
            thickness="0.2mm"
            adhesiveThickness="0.05mm"
            outline={Array.from({ length: 48 }, (_, j) => ({
              x: 5.5 * Math.cos((j * Math.PI) / 24),
              y: 5.5 * Math.sin((j * Math.PI) / 24),
            }))}
          />
          <resistor
            name={`R${i + 1}`}
            resistance="1k"
            footprint="0402"
            pcbX={1}
            pcbY={1}
          />
          <silkscreentext
            text={`${i + 1}`}
            pcbY={-3}
            fontSize={1.4}
            anchorAlignment="center"
          />
        </group>
      ))}
      {copperRoutes.map((route, i) => (
        <Fragment key={i}>
          <pcbtrace route={route} />
        </Fragment>
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()
  const board = circuit.db.pcb_board.list()[0]
  expect(board).toMatchObject({ material: "flex" })
  expect(circuit.db.pcb_bend.list()).toHaveLength(4)
  expect(circuit.db.pcb_stiffener.list()).toHaveLength(3)
  for (const bend of circuit.db.pcb_bend.list()) {
    expect(pcb_bend.safeParse(bend).success).toBe(true)
    expect(bend.pcb_board_id).toBe(board.pcb_board_id)
  }
  for (const stiffener of circuit.db.pcb_stiffener.list()) {
    expect(pcb_stiffener.safeParse(stiffener).success).toBe(true)
  }
  const flatJson = JSON.stringify(circuit.getCircuitJson())
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  // Exported glTF uses +Y up, mm. Explicit views show both U-folds and all layers.
  const views = [
    { name: "isometric", camPos: [22, 22, 28], up: "y+" },
    { name: "side_z_pos", camPos: [0, 6, 38], up: "y+" },
    { name: "end_x_pos", camPos: [38, 6, 0], up: "y+" },
    { name: "top_y_pos", camPos: [0, 44, 0], up: "z-" },
  ] as const
  for (const view of views) {
    await expect(circuit).toMatch3dSnapshot(import.meta.path, {
      snapshotSuffix: view.name,
      gltf: { foldPcbs: true, boardTextureResolution: 1024 },
      poppygl: {
        width: 600,
        height: 500,
        camPos: [...view.camPos],
        up: view.up,
        lookAt: [0, 6, 0],
        fov: 35,
        backgroundColor: "#f2f3f5",
        grid: undefined,
      },
    })
  }
  expect(JSON.stringify(circuit.getCircuitJson())).toBe(flatJson)
})
