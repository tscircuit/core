import { expect, test } from "bun:test"
import { assembly } from "lib"
import { convertSceneToGLTF, loadJscadPlan } from "circuit-json-to-gltf"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("view extents measure an imported GLB with model unit scaling", async () => {
  const glb = await convertSceneToGLTF(
    {
      boxes: [
        {
          center: { x: 0, y: 0, z: 0 },
          size: { x: 20, y: 8, z: 12 },
          mesh: loadJscadPlan({ type: "cuboid", size: [20, 12, 8] }),
        },
      ],
    },
    { binary: true },
  )
  const glbUrl = `data:model/gltf-binary;base64,${Buffer.from(glb as ArrayBuffer).toString("base64")}`
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.part
        name="imported"
        cadModel={{
          glbUrl,
          modelUnitToMmScale: 1.5,
          modelBoardNormalDirection: "y+",
        }}
      />
      <assembly.drawing.page size="iso_a4">
        <assembly.drawing.titleblock title="IMPORTED GLB / 1.5× MODEL UNIT SCALE" />
        <assembly.drawing.partview
          name="plan"
          displayName="30 × 18 mm"
          partRef=".imported"
          direction="z+"
          width={65}
          height={60}
          centerX={-50}
          centerY={25}
        >
          <assembly.drawing.dimension widthOfView />
          <assembly.drawing.dimension heightOfView />
        </assembly.drawing.partview>
        <assembly.drawing.partview
          name="side"
          displayName="12 mm HEIGHT"
          partRef=".imported"
          direction="x+"
          width={50}
          height={60}
          centerX={40}
          centerY={25}
        >
          <assembly.drawing.dimension heightOfView />
        </assembly.drawing.partview>
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.drawing_dimension_line.list().map((line) => line.text),
  ).toEqual(["30 mm", "18 mm", "12 mm"])
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
})
