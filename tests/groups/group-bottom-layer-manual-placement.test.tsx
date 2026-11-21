import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a bottom-side group mirrors a member with a stored manual placement", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={24}
      height={18}
      schematicDisabled
      routingDisabled
      manualEdits={{
        pcb_placements: [
          {
            selector: "U1",
            center: { x: 4, y: 2 },
            relative_to: "group_center",
          },
        ],
      }}
    >
      <group pcbX={3} pcbY={-2} layer="bottom">
        <chip name="U1" footprint="soic8" layer="bottom" pcbRotation={90} />
      </group>
      <pcbnotetext text="U1: stored placement flips to top" pcbY={6} />
    </board>,
  )

  const { circuit: explicitFlip } = getTestFixture()
  explicitFlip.add(
    <board
      width={24}
      height={18}
      schematicDisabled
      routingDisabled
      manualEdits={{
        pcb_placements: [
          {
            selector: "U1",
            center: { x: -4, y: 2 },
            relative_to: "group_center",
          },
        ],
      }}
    >
      <group pcbX={3} pcbY={-2}>
        <chip name="U1" footprint="soic8" layer="top" pcbRotation={-90} />
      </group>
      <pcbnotetext text="U1: stored placement flips to top" pcbY={6} />
    </board>,
  )

  explicitFlip.render()
  circuit.render()

  await expect(explicitFlip.getCircuitJson()).toMatchPcbSnapshot(
    import.meta.path,
  )
  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
  expect(circuit.db.pcb_smtpad.list()).toEqual(
    explicitFlip.db.pcb_smtpad.list(),
  )
})
