import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("grid layout moves standalone apertures together with their component pads", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={26} height={24} routingDisabled schematicDisabled>
      <group pcbGrid pcbGridCols={2} pcbGridGap={4} pcbX={2} pcbY={1}>
        {[1, 2, 3, 4].map((pin) => (
          <chip
            key={pin}
            name={`U${pin}`}
            footprint={
              <footprint>
                <smtpad
                  shape="rect"
                  width={3}
                  height={2}
                  pcbX={1}
                  pcbY={0.5}
                  layer="top"
                  portHints={["1"]}
                  solderPasteMargin={-1}
                />
                <solderpaste
                  shape="rect"
                  width={2}
                  height={1}
                  pcbX={1}
                  pcbY={0.5}
                />
              </footprint>
            }
          />
        ))}
      </group>
      <pcbnotetext
        text="Grid: each paste window stays centered on its pad"
        pcbY={-9}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const apertures = circuit.db.pcb_solder_paste.list()
  expect(apertures).toHaveLength(4)
  expect(
    new Set(
      apertures.map((paste) => {
        if (paste.shape !== "rect")
          throw new Error("Expected rectangular aperture")
        return `${paste.x},${paste.y}`
      }),
    ).size,
  ).toBe(4)
  for (const aperture of apertures) {
    if (aperture.shape !== "rect")
      throw new Error("Expected rectangular aperture")
    const pad = circuit.db.pcb_smtpad
      .list()
      .find((pad) => pad.pcb_component_id === aperture.pcb_component_id)!
    if (pad.shape !== "rect") throw new Error("Expected rectangular pad")
    expect(aperture.x).toBeCloseTo(pad.x, 7)
    expect(aperture.y).toBeCloseTo(pad.y, 7)
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
