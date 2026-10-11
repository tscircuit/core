import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fabrication paths emit fill and stroke flags on both board sides", async () => {
  const { circuit } = getTestFixture()
  const route = [
    { x: -1.5, y: -1.5 },
    { x: 1.5, y: -1.5 },
    { x: 1.5, y: -0.5 },
    { x: -0.5, y: -0.5 },
    { x: -0.5, y: 1.5 },
    { x: -1.5, y: 1.5 },
  ]
  circuit.add(
    <board width="18mm" height="14mm">
      {(["top", "bottom"] as const).flatMap((layer) =>
        [-5, 0, 5].map((x, index) => (
          <chip
            key={`${layer}${index}`}
            name={`${layer}${index}`}
            pcbX={x}
            pcbY={layer === "top" ? 3 : -3}
            layer={layer}
            footprint={
              <footprint>
                <fabricationnotepath
                  route={index === 2 ? [...route, route[0]!] : route}
                  strokeWidth="0.2mm"
                  {...(index === 2
                    ? {}
                    : { isFilled: true, hasStroke: index === 1 })}
                />
                <fabricationnotetext
                  text={["FILL ONLY", "FILL + STROKE", "LEGACY STROKE"][index]!}
                  anchorAlignment="center"
                  pcbY={2.2}
                  fontSize={0.4}
                />
              </footprint>
            }
          />
        )),
      )}
    </board>,
  )
  circuit.render()
  const paths = circuit.db.pcb_fabrication_note_path.list()
  expect(paths).toHaveLength(6)
  for (const layer of ["top", "bottom"] as const) {
    const notes = paths.filter((p) => p.layer === layer)
    expect(notes[0]).toMatchObject({ is_filled: true, has_stroke: false })
    expect(notes[1]).toMatchObject({ is_filled: true, has_stroke: true })
    expect(notes[2].is_filled).toBeUndefined()
    expect(notes[2].has_stroke).toBeUndefined()
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
