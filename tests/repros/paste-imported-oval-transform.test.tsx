import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an imported oval survives cached rotation on the bottom layer", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={14} height={10} routingDisabled schematicDisabled>
      <subcircuit name="CACHED" pcbRotation={35} _subcircuitCachingEnabled>
        <subcircuit
          name="OVAL"
          circuitJson={[
            {
              type: "pcb_solder_paste",
              pcb_solder_paste_id: "oval",
              shape: "oval",
              x: 0,
              y: 0,
              width: 4,
              height: 1.5,
              layer: "bottom",
            },
          ]}
        />
      </subcircuit>
      <pcbnotetext
        text="Bottom oval: 4 x 1.5 mm at 35 deg"
        pcbY={-3.5}
        fontSize={0.45}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
  const aperture = circuit.db.pcb_solder_paste.list()[0]
  expect(aperture).toMatchObject({ shape: "polygon", layer: "bottom" })
  if (aperture?.shape !== "polygon")
    throw new Error("Expected the transformed oval contour")
  expect(aperture.points).toHaveLength(64)
  expect(aperture.points[0]?.x).toBeCloseTo(
    2 * Math.cos((35 * Math.PI) / 180),
    6,
  )
  expect(aperture.points[0]?.y).toBeCloseTo(
    2 * Math.sin((35 * Math.PI) / 180),
    6,
  )
})
