import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("cached standalone polygon paste retains its complete contour and inner opening", async () => {
  const points = [
    { x: -2, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
    { x: 0, y: 2 },
    { x: -2, y: 2 },
  ]
  const hole = [
    { x: -1.5, y: 0 },
    { x: -0.5, y: 0 },
    { x: -0.5, y: 0.5 },
  ]
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={22} height={12} routingDisabled schematicDisabled>
      <subcircuit name="STENCIL" _subcircuitCachingEnabled pcbX={2} pcbY={1}>
        <solderpaste
          shape="polygon"
          points={points}
          holes={[hole]}
          pcbX={-4}
          pcbRotation={90}
        />
        <solderpaste
          shape="polygon"
          points={points}
          holes={[hole]}
          pcbX={4}
          layer="bottom"
          pcbRotation={270}
        />
      </subcircuit>
      <pcbnotetext
        text="Cached polygons keep contours and unprinted islands"
        pcbY={-4}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const paste = circuit.db.pcb_solder_paste.list()
  expect(paste).toHaveLength(2)
  const top = paste.find((aperture) => aperture.layer === "top")!
  if (top.shape !== "polygon") throw new Error("Expected polygon paste")
  expect(top.points[0]!.x).toBeCloseTo(-1, 7)
  expect(top.points[0]!.y).toBeCloseTo(-1, 7)
  expect(top.holes![0]).toHaveLength(3)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
