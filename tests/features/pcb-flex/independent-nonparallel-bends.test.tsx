import { expect, test } from "bun:test"
import {
  rotateVector,
  transformCircuitJsonCadComponents,
} from "@tscircuit/flex-utils"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { TwoArmFlexBoard } from "./two-arm-bends.fixture"

test("independent nonparallel bends fold both arms while the body remains flat", async () => {
  const render = async (folded: boolean) => {
    const { circuit } = getTestFixture()
    circuit.add(<TwoArmFlexBoard folded={folded} sideBendSide="right" />)
    await circuit.renderUntilSettled()
    return circuit
  }
  const flat = await render(false)
  const folded = await render(true)
  expect(folded.db.pcb_placement_error.list()).toHaveLength(0)
  expect(folded.db.pcb_component.list()).toEqual(flat.db.pcb_component.list())
  expect(folded.db.schematic_component.list()).toHaveLength(3)
  const [topCad, rightCad, bodyCad] = folded.db.cad_component.list()
  const [flatTop, flatRight, flatBody] = flat.db.cad_component.list()
  // Emitted positions are points in right-handed Circuit JSON world mm (+Z up).
  // A 90-degree radius-1 bend has a pi/2-mm arc centered on each chord.
  expect(topCad.position.x).toBeCloseTo(0, 7)
  expect(topCad.position.y).toBeCloseTo(21 - Math.PI / 4 - 0.06, 7)
  expect(topCad.position.z).toBeCloseTo(6 - Math.PI / 4, 7)
  expect(topCad.rotation!.x).toBeCloseTo(90, 7)
  expect(topCad.rotation!.y).toBeCloseTo(0, 7)
  expect(rightCad.position.x).toBeCloseTo(31 - Math.PI / 4 - 0.06, 7)
  expect(rightCad.position.y).toBeCloseTo(0, 7)
  expect(rightCad.position.z).toBeCloseTo(6 - Math.PI / 4, 7)
  expect(rightCad.rotation!.x).toBeCloseTo(0, 7)
  expect(rightCad.rotation!.y).toBeCloseTo(-90, 7)
  expect(bodyCad.position).toEqual(flatBody.position)
  for (const coordinate of ["x", "y", "z"] as const) {
    expect(bodyCad.rotation![coordinate]).toBeCloseTo(
      flatBody.rotation![coordinate],
      7,
    )
  }
  expect(topCad.is_on_folded_board).toBe(true)
  expect(rightCad.is_on_folded_board).toBe(true)
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
      camPos: [70, 65, -70],
      lookAt: [-8, 3, 7],
      up: "y+",
      fov: 35,
      backgroundColor: "#f2f3f5",
      ambient: 0.45,
      grid: undefined,
    },
  })
  expect(folded.getCircuitJson()).toEqual(before)
})
