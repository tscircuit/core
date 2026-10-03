import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("cached polygon pads preserve paste geometry and mask coverage", async () => {
  const { circuit } = getTestFixture()
  const points = [
    { x: -1, y: -1 },
    { x: 2, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 },
  ]
  circuit.add(
    <board width={44} height={30}>
      {(["top", "bottom"] as const).flatMap((layer, row) =>
        [0, 90, 180, 270].map((pcbRotation, column) => (
          <subcircuit
            key={`${layer}-${pcbRotation}`}
            name={`S${row * 4 + column + 1}`}
            _subcircuitCachingEnabled
            pcbX={column * 10 - 15}
            pcbY={row * 12 - 6}
            pcbRotation={pcbRotation}
          >
            <chip
              name="U1"
              layer={layer}
              footprint={
                <footprint>
                  <smtpad
                    shape="polygon"
                    portHints={["pin1"]}
                    points={points}
                    solderPasteMargin={0}
                  />
                  <smtpad
                    shape="polygon"
                    portHints={["pin2"]}
                    points={points.map(({ x, y }) => ({ x: x + 4, y }))}
                    coveredWithSolderMask
                  />
                  <smtpad
                    shape="polygon"
                    portHints={["pin3"]}
                    points={[
                      { x: -0.2, y: 3 },
                      { x: 0.2, y: 3 },
                      { x: 0, y: 3.4 },
                    ]}
                    solderPasteMargin={-0.3}
                  />
                </footprint>
              }
            />
          </subcircuit>
        )),
      )}
      <pcbnotetext
        text="Cached polygons: zero margin, mask-covered and eroded paste"
        pcbY={13.5}
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.cachedSubcircuits!.size).toBe(2)
  const pads = circuit.db.pcb_smtpad.list()
  const apertures = circuit.db.pcb_solder_paste.list()
  expect(pads).toHaveLength(24)
  expect(apertures).toHaveLength(8)
  for (const pad of pads) {
    if (pad.shape !== "polygon") throw new Error("Expected polygon pad")
    const paste = apertures.filter(
      (paste) => paste.pcb_smtpad_id === pad.pcb_smtpad_id,
    )
    if (pad.port_hints?.includes("pin2")) {
      expect(pad.is_covered_with_solder_mask).toBe(true)
      expect(paste).toHaveLength(0)
      continue
    }
    if (pad.port_hints?.includes("pin3")) {
      expect(pad.is_covered_with_solder_mask).toBe(false)
      expect(paste).toHaveLength(0)
      continue
    }
    expect(paste).toHaveLength(1)
    const aperture = paste[0]!
    if (aperture.shape !== "polygon") throw new Error("Expected polygon paste")
    expect(aperture.layer).toBe(pad.layer)
    expect(any_circuit_element.safeParse(aperture).success).toBe(true)
    for (const point of pad.points) {
      expect(
        aperture.points.some(
          (pastePoint) =>
            Math.abs(pastePoint.x - point.x) < 1e-6 &&
            Math.abs(pastePoint.y - point.y) < 1e-6,
        ),
      ).toBe(true)
    }
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
