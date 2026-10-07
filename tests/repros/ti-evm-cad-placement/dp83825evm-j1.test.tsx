import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { createTiEvmCadPlacementRepro } from "./create-ti-evm-cad-placement-repro"

test("DP83825EVM J1 CAD placement", async () => {
  const { circuit } = getTestFixture()
  const repro = await createTiEvmCadPlacementRepro({
    cadModelIndex: 8,
    fixtureName: "dp83825evm",
    name: "J1",
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
      "layer": undefined,
      "position": {
        "x": -42.925917449999986,
        "y": 19.150023929994916,
        "z": 3.05000058,
      },
      "rotation": {
        "x": 270,
        "y": 0,
        "z": 270,
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
