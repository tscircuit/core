import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { createTiEvmCadPlacementRepro } from "./create-ti-evm-cad-placement-repro"

test("LM251772EVM-PD D3 CAD placement", async () => {
  const { circuit } = getTestFixture()
  const repro = await createTiEvmCadPlacementRepro({
    cadModelIndex: 44,
    fixtureName: "lm251772evm-pd",
    name: "D3",
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
        "x": -4.951084839999993,
        "y": -33.64006734,
        "z": -2.1152399400000004,
      },
      "rotation": {
        "x": 180,
        "y": 0,
        "z": 90,
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
