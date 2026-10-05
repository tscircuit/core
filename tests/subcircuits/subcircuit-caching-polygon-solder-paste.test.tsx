import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const square = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
]
const pads = [
  { vertices: square, margin: 0, covered: false },
  { vertices: square, margin: -2, covered: false },
  { vertices: square, margin: undefined, covered: true },
  {
    vertices: [
      [0, 0],
      [2, 0],
      [2, 0.8],
      [4, 0.8],
      [4, 0],
      [6, 0],
      [6, 2],
      [4, 2],
      [4, 1.2],
      [2, 1.2],
      [2, 2],
      [0, 2],
    ],
    margin: -0.3,
    covered: false,
  },
  {
    vertices: [
      [0, 0],
      [6, 0],
      [6, 2.8],
      [5, 2.8],
      [5, 1],
      [1, 1],
      [1, 5],
      [5, 5],
      [5, 3.2],
      [6, 3.2],
      [6, 6],
      [0, 6],
    ],
    margin: 0.3,
    covered: false,
  },
]

function PolygonSubcircuit({
  name,
  layer,
  pcbX,
  cached,
}: {
  name: string
  layer: "top" | "bottom"
  pcbX: number
  cached: boolean
}) {
  return (
    <subcircuit
      name={name}
      pcbX={pcbX}
      pcbY={layer === "top" ? -4 : 4}
      _subcircuitCachingEnabled={cached}
    >
      <chip
        name="U1"
        layer={layer}
        pinLabels={{
          1: "ZERO",
          2: "REMOVED",
          3: "COVERED",
          4: "SPLIT",
          5: "OPENING",
        }}
        footprint={
          <footprint>
            {pads.map(({ vertices, margin, covered }, index) => (
              <Fragment key={index}>
                <smtpad
                  shape="polygon"
                  pcbX={index * 8}
                  points={vertices.map(([x, y]) => ({ x: x!, y: y! }))}
                  portHints={[`pin${index + 1}`]}
                  solderPasteMargin={margin}
                  coveredWithSolderMask={covered}
                  solderMaskMargin={0.1}
                />
              </Fragment>
            ))}
          </footprint>
        }
      />
    </subcircuit>
  )
}

test("cached polygon footprints preserve paste geometry and absence on both layers", async () => {
  for (const cached of [false, true]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={100} height={24}>
        {(["top", "bottom"] as const).flatMap((layer, row) =>
          [-45, 0].map((pcbX, column) => (
            <PolygonSubcircuit
              key={`${layer}-${column}`}
              name={`S${row * 2 + column + 1}`}
              layer={layer}
              pcbX={pcbX}
              cached={cached}
            />
          )),
        )}
        <pcbnotetext
          text="Cached polygon paste: zero / removed / covered / split / opening"
          pcbY={10}
          fontSize={1}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const pads = circuit.db.pcb_smtpad.list()
    const paste = circuit.db.pcb_solder_paste.list()
    expect(pads).toHaveLength(20)
    expect(paste).toHaveLength(16)
    if (cached) expect(circuit.cachedSubcircuits?.size).toBe(2)
    for (const pad of pads) {
      const apertures = paste.filter(
        (aperture) => aperture.pcb_smtpad_id === pad.pcb_smtpad_id,
      )
      expect(pad.soldermask_margin).toBe(0.1)
      expect(pad.is_covered_with_solder_mask).toBe(
        pad.port_hints?.includes("pin3"),
      )
      if (
        pad.port_hints?.includes("pin2") ||
        pad.port_hints?.includes("pin3")
      ) {
        expect(apertures).toHaveLength(0)
        continue
      }
      expect(apertures).toHaveLength(pad.port_hints?.includes("pin4") ? 2 : 1)
      for (const aperture of apertures) {
        expect(aperture.layer).toBe(pad.layer)
        expect(aperture.shape).toBe("polygon")
        if (aperture.shape === "polygon") {
          expect(aperture.holes ?? []).toHaveLength(
            pad.port_hints?.includes("pin5") ? 1 : 0,
          )
        }
      }
      if (
        pad.port_hints?.includes("pin1") &&
        pad.shape === "polygon" &&
        apertures[0].shape === "polygon"
      ) {
        expect(apertures[0].points).toEqual(pad.points)
      }
    }
    // Both paths must match the same rendered aperture geometry, including holes.
    await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
      showSolderPaste: true,
    })
  }
})
