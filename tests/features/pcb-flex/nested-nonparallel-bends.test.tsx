import { expect, test } from "bun:test"
import {
  rotateVector,
  transformCircuitJsonCadComponents,
} from "@tscircuit/flex-utils"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { TwoArmFlexBoard } from "./two-arm-bends.fixture"

test("the original left-side bends fold the top arm before carrying the body", async () => {
  const render = async (folded: boolean) => {
    const { circuit } = getTestFixture()
    circuit.add(<TwoArmFlexBoard folded={folded} sideBendSide="left" />)
    await circuit.renderUntilSettled()
    return circuit
  }
  const flat = await render(false)
  const folded = await render(true)
  expect(folded.db.pcb_placement_error.list()).toHaveLength(0)
  expect(folded.db.pcb_component.list()).toEqual(flat.db.pcb_component.list())
  const [topCad, rightCad, bodyCad] = folded.db.cad_component.list()
  const [flatTop, flatRight, flatBody] = flat.db.cad_component.list()
  // The upward vertical chord's left side is the body, not the outward tip.
  // These are emitted world points (+X right, +Y top, right-handed +Z up, mm).
  expect(topCad.position.x).toBeCloseTo(35, 7)
  expect(topCad.position.y).toBeCloseTo(21 - Math.PI / 4 - 0.06, 7)
  expect(topCad.position.z).toBeCloseTo(31 - Math.PI / 4, 7)
  expect(bodyCad.position.x).toBeCloseTo(29 + Math.PI / 4 + 0.06, 7)
  expect(bodyCad.position.y).toBeCloseTo(0, 7)
  expect(bodyCad.position.z).toBeCloseTo(31 - Math.PI / 4, 7)
  expect(rightCad.position).toEqual(flatRight.position)
  for (const coordinate of ["x", "y", "z"] as const) {
    expect(rightCad.rotation![coordinate]).toBeCloseTo(
      flatRight.rotation![coordinate],
      7,
    )
  }
  // Directions do not acquire translation. The top arm's local +X points down
  // after the body fold; its local +Y points right after both 90-degree folds.
  const topX = rotateVector({ x: 1, y: 0, z: 0 }, topCad.rotation!)
  const topY = rotateVector({ x: 0, y: 1, z: 0 }, topCad.rotation!)
  const bodyNormal = rotateVector({ x: 0, y: 0, z: 1 }, bodyCad.rotation!)
  for (const coordinate of ["x", "y", "z"] as const) {
    expect(topX[coordinate]).toBeCloseTo({ x: 0, y: 0, z: -1 }[coordinate], 7)
    expect(topY[coordinate]).toBeCloseTo({ x: 1, y: 0, z: 0 }[coordinate], 7)
    expect(bodyNormal[coordinate]).toBeCloseTo(
      { x: 1, y: 0, z: 0 }[coordinate],
      7,
    )
  }
  expect(topCad.is_on_folded_board).toBe(true)
  expect(bodyCad.is_on_folded_board).toBe(true)
  const restored = transformCircuitJsonCadComponents(folded.getCircuitJson(), {
    foldPcbs: false,
  }).filter((element) => element.type === "cad_component")
  for (const [index, flatCad] of [flatTop, flatRight, flatBody].entries()) {
    for (const coordinate of ["x", "y", "z"] as const) {
      expect(restored[index].position[coordinate]).toBeCloseTo(
        flatCad.position[coordinate],
        7,
      )
    }
    for (const flatAxis of [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    ]) {
      const restoredAxis = rotateVector(flatAxis, restored[index].rotation!)
      const originalAxis = rotateVector(flatAxis, flatCad.rotation!)
      for (const coordinate of ["x", "y", "z"] as const) {
        expect(restoredAxis[coordinate]).toBeCloseTo(
          originalAxis[coordinate],
          7,
        )
      }
    }
  }
  const before = folded.getCircuitJson()
  await folded.renderUntilSettled()
  expect(folded.getCircuitJson()).toEqual(before)
  await expect(folded).toMatchPcbSnapshot(import.meta.path, {
    showBendLines: true,
  })
  await expect(folded).toMatch3dSnapshot(import.meta.path, {
    gltf: { boardTextureResolution: 1024, showErrors: true },
    diffTolerance: 0.001,
    poppygl: {
      width: 1000,
      height: 760,
      // Camera points: right-handed glTF (+Y up, mm), mapping (-X, Z, Y).
      camPos: [-95, 85, -85],
      lookAt: [-25, 22, 8],
      up: "y+",
      fov: 35,
      backgroundColor: "#f2f3f5",
      ambient: 0.45,
      grid: undefined,
    },
  })
  expect(folded.getCircuitJson()).toEqual(before)
})
