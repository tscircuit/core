import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("grid layout and removal preserve off-origin polygon paste and its islands", async () => {
  const points = [
    { x: 1, y: 0 },
    { x: 3, y: 0 },
    { x: 3, y: 1 },
    { x: 1, y: 1 },
  ]
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={22} height={16} routingDisabled schematicDisabled>
      <group pcbGrid pcbGridCols={2} pcbGridGap={3} pcbX={2} pcbY={1}>
        {[1, 2, 3, 4].map((pin) => (
          <chip
            key={pin}
            name={`J${pin}`}
            footprint={
              <footprint noSolderPaste>
                <smtpad shape="polygon" points={points} portHints={["1"]} />
                <solderpaste
                  shape="polygon"
                  points={points}
                  holes={[
                    [
                      { x: 1.5, y: 0.2 },
                      { x: 2, y: 0.2 },
                      { x: 2, y: 0.7 },
                    ],
                  ]}
                />
              </footprint>
            }
          />
        ))}
      </group>
      <pcbnotetext
        text="Grid: stencil follows copper; first aperture removed"
        pcbY={-5}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_solder_paste.list()).toHaveLength(4)
  for (const paste of circuit.db.pcb_solder_paste.list()) {
    if (paste.shape !== "polygon") throw new Error("Expected polygon paste")
    const pad = circuit.db.pcb_smtpad
      .list()
      .find((pad) => pad.pcb_component_id === paste.pcb_component_id)!
    if (pad.shape !== "polygon") throw new Error("Expected polygon copper")
    expect(paste.points).toEqual(pad.points)
    expect(paste.holes![0]![0]!.x - paste.points[0]!.x).toBeCloseTo(0.5, 7)
    expect(paste.holes![0]![0]!.y - paste.points[0]!.y).toBeCloseTo(0.2, 7)
  }
  const firstPaste = circuit.selectAll("solderpaste")[0]!
  firstPaste.shouldBeRemoved = true
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_solder_paste.list()).toHaveLength(3)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(4)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
