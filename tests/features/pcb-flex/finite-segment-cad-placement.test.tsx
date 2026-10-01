import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { transformCircuitJsonCadComponents } from "@tscircuit/flex-utils"

const outline = [
  { x: -20, y: -10 },
  { x: 20, y: -10 },
  { x: 20, y: 30 },
  { x: 12, y: 30 },
  { x: 12, y: 10 },
  { x: -12, y: 10 },
  { x: -12, y: 30 },
  { x: -20, y: 30 },
]

test("finite bend folds only its tail before CAD insertion, including a translated board", async () => {
  for (const offset of [
    { x: 0, y: 0 },
    { x: 100, y: -70 },
  ]) {
    const render = async (bent: boolean) => {
      const { circuit } = getTestFixture()
      circuit.add(
        <board
          material="flex"
          layers={2}
          thickness={0.12}
          solderMaskColor="#cc9b32"
          routingDisabled
          schematicDisabled
          pcbX={offset.x}
          pcbY={offset.y}
          outline={outline.map((point) => ({
            x: point.x + offset.x,
            y: point.y + offset.y,
          }))}
        >
          {bent && (
            <pcbbend
              x1={-20}
              y1={20}
              x2={-12}
              y2={20}
              bendAngle={90}
              bendRadius={1}
              bendSide="left"
            />
          )}
          <resistor
            name="RL"
            resistance="1k"
            footprint="0402"
            pcbX={-16}
            pcbY={25}
          />
          <resistor
            name="RR"
            resistance="1k"
            footprint="0402"
            pcbX={16}
            pcbY={25}
          />
          <silkscreentext
            text="RL"
            pcbX={-16}
            pcbY={27.5}
            fontSize={1.6}
            anchorAlignment="center"
          />
          <silkscreentext
            text="RR"
            pcbX={16}
            pcbY={27.5}
            fontSize={1.6}
            anchorAlignment="center"
          />
        </board>,
      )
      await circuit.renderUntilSettled()
      return circuit
    }
    const flat = await render(false)
    const folded = await render(true)
    expect(folded.db.pcb_component.list()).toEqual(flat.db.pcb_component.list())
    const [left, right] = folded.db.cad_component.list()
    const [flatLeft, flatRight] = flat.db.cad_component.list()
    expect(left!.position.z).toBeCloseTo(6 - Math.PI / 4, 7)
    expect(left!.rotation!.x).toBeCloseTo(90, 7)
    expect(left!.position.x).toBeCloseTo(flatLeft!.position.x, 7)
    expect(right!.position).toEqual(flatRight!.position)
    for (const coordinate of ["x", "y", "z"] as const)
      expect(right!.rotation![coordinate]).toBeCloseTo(
        flatRight!.rotation![coordinate],
        7,
      )
    const restored = transformCircuitJsonCadComponents(
      folded.getCircuitJson(),
      { foldPcbs: false },
    ).filter((element) => element.type === "cad_component")
    for (let i = 0; i < restored.length; i++)
      for (const coordinate of ["x", "y", "z"] as const)
        expect(restored[i]!.position[coordinate]).toBeCloseTo(
          flat.db.cad_component.list()[i]!.position[coordinate],
          7,
        )

    for (const circuit of [flat, folded]) {
      await expect(circuit).toMatch3dSnapshot(import.meta.path, {
        // The exporter selects the pose from core's emitted CAD fold flags.
        gltf: { boardTextureResolution: 1024 },
        snapshotSuffix: circuit === flat ? "flat" : "folded",
        diffTolerance: 0.001,
        poppygl: {
          width: 1000,
          height: 760,
          // Camera points are right-handed glTF (+Y up, mm), following
          // getBestCameraPosition's Circuit JSON -> glTF mapping (-X, Z, Y).
          camPos: [55 - offset.x, 60, -65 + offset.y],
          lookAt: [-offset.x, 2, 9 + offset.y],
          up: "y+",
          fov: 35,
          backgroundColor: "#f2f3f5",
          ambient: 0.45,
          grid: undefined,
        },
      })
    }
  }
})
