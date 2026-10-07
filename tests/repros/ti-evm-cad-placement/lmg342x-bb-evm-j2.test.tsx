import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { createTiEvmCadPlacementRepro } from "./create-ti-evm-cad-placement-repro"

test("LMG342X-BB-EVM J2 CAD placement", async () => {
  const { circuit } = getTestFixture()
  const repro = await createTiEvmCadPlacementRepro({
    cadModelIndex: 6,
    fixtureName: "lmg342x-bb-evm",
    name: "J2",
  })
  circuit.add(repro.circuitElement)

  await circuit.renderUntilSettled()
  const renderedCircuitJson = circuit.getCircuitJson()
  const cadComponent = repro.getTargetRenderedCadComponent({
    renderedCircuitJson,
  })
  expect({
    layer: cadComponent?.layer,
    position: cadComponent?.position,
    rotation: cadComponent?.rotation,
  }).toMatchInlineSnapshot(`
    {
      "layer": "top",
      "position": {
        "x": -2.4129999999999967,
        "y": 42.30204646,
        "z": 0.8,
      },
      "rotation": {
        "x": 0,
        "y": 0,
        "z": 180,
      },
    }
  `)
  const visualSnapshot = repro.getVisualSnapshot({ renderedCircuitJson })
  await expect(visualSnapshot.circuitJson).toMatch3dSnapshot(import.meta.path, {
    camPos: [...visualSnapshot.topCamera.camPos],
    poppygl: {
      backgroundColor: "#07100c",
      fov: visualSnapshot.topCamera.fov,
      grid: false,
      lookAt: visualSnapshot.topCamera.lookAt,
    },
    snapshotSuffix: "full-board-top",
  })
  await expect(visualSnapshot.circuitJson).toMatch3dSnapshot(import.meta.path, {
    camPos: [...visualSnapshot.bottomCamera.camPos],
    poppygl: {
      backgroundColor: "#07100c",
      fov: visualSnapshot.bottomCamera.fov,
      grid: false,
      lookAt: visualSnapshot.bottomCamera.lookAt,
    },
    snapshotSuffix: "full-board-bottom",
  })
}, 60_000)
