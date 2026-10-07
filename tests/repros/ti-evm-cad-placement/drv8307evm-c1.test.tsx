import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { createTiEvmCadPlacementRepro } from "./create-ti-evm-cad-placement-repro"

test("DRV8307EVM C1 CAD placement", async () => {
  const { circuit } = getTestFixture()
  const repro = await createTiEvmCadPlacementRepro({
    cadModelIndex: 4,
    fixtureName: "drv8307evm",
    name: "C1",
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
        "x": 27.318200379999993,
        "y": -14.431053179999992,
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
