import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"

test("custom NEMA body length controls backface placement with zero default gap", async () => {
  const { circuit } = getTestFixture()
  const model =
    "nema17_bodylength48mm_shaftlength30mm_flatdepth0.5mm_flatlength18mm"
  circuit.add(
    <assembly.device>
      <assembly.motor name="CUSTOM" model={model} />
      <board
        name="B1"
        width={42}
        height={42}
        thickness={2}
        mountedTo="CUSTOM.backface"
        routingDisabled
      >
        <pcbnotetext
          text="48 mm body, 30 mm shaft, flush rear mount"
          pcbY={23}
          fontSize={1}
        />
      </board>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const cad = circuit.db.cad_component.list()[0]!
  expect(cad.model_glb_url).toBe(
    `https://modelcdn.tscircuit.com/jscad_models/${model}.glb`,
  )
  const bounds = await getRenderedMotorBounds(
    circuit.getCircuitJson().filter((el) => el.type === "cad_component"),
  )
  expect(bounds.min[1]).toBeCloseTo(1, 2)
  expect(bounds.max[1]! - bounds.min[1]!).toBeCloseTo(78, 2)
  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path, {
    camPos: [110, 90, 110],
    poppygl: { lookAt: [0, 35, 0], grid: false, backgroundColor: [1, 1, 1] },
  })
})
