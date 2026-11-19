import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a translated bottom-side subcircuit reflects its own stored placement", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={18} schematicDisabled routingDisabled>
      <group
        subcircuit
        pcbX={3}
        pcbY={-2}
        layer="bottom"
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
        <chip name="U1" footprint="soic8" pcbRotation={90} />
      </group>
      <pcbnotetext
        text="U1 flips to (-1, 0) mm on bottom"
        pcbY={6}
        fontSize={0.5}
      />
    </board>,
  )

  const { circuit: explicitFlip } = getTestFixture()
  explicitFlip.add(
    <board width={24} height={18} schematicDisabled routingDisabled>
      <group subcircuit pcbX={3} pcbY={-2}>
        <chip
          name="U1"
          footprint="soic8"
          pcbX={-4}
          pcbY={2}
          pcbRotation={-90}
          layer="bottom"
        />
      </group>
      <pcbnotetext
        text="U1 flips to (-1, 0) mm on bottom"
        pcbY={6}
        fontSize={0.5}
      />
    </board>,
  )

  explicitFlip.render()
  circuit.render()

  await expect(explicitFlip.getCircuitJson()).toMatchPcbSnapshot(
    import.meta.path,
  )
  expect(circuit.db.pcb_smtpad.list()).toEqual(
    explicitFlip.db.pcb_smtpad.list(),
  )
  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
