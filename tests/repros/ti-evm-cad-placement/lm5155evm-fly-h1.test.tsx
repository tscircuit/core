import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { createTiEvmCadPlacementRepro } from "./create-ti-evm-cad-placement-repro"

test("LM5155EVM-FLY H1 CAD placement", async () => {
  const { circuit } = getTestFixture()
  const repro = await createTiEvmCadPlacementRepro({
    cadModelIndex: 17,
    fixtureName: "lm5155evm-fly",
    name: "H1",
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
      "layer": "bottom",
      "position": {
        "x": 37.46508128,
        "y": 15.874918719999997,
        "z": -0.81532128,
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
