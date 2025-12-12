import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb_group with positioned_relative_to_pcb_group_id", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="80mm" height="60mm">
      {/* Parent group */}
      <group name="G1" pcbX={-10} pcbY={5} width="20mm" height="15mm">
        {/* Child group positioned relative to parent group */}
        <group name="G2" pcbX={15} pcbY={-10} width="18mm" height="12mm" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(
    import.meta.path + "-group-to-group",
    {
      showAnchorOffsets: true,
      showPcbGroups: true,
    },
  )
})

test("pcb_group with positioned_relative_to_pcb_board_id", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="30mm">
      <group name="G1" pcbX={-10} pcbY={5} width="15mm" height="10mm" />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(
    import.meta.path + "-group-to-board",
    {
      showAnchorOffsets: true,
      showPcbGroups: true,
    },
  )
})

test("pcb_component with positioned_relative_to_pcb_group_id shows anchor offsets", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="30mm">
      <group name="G1" pcbX={-5} pcbY={5} width="20mm" height="20mm">
        <resistor
          name="R1"
          pcbX={10}
          pcbY={-10}
          footprint="0402"
          resistance="1k"
        />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(
    import.meta.path + "-component-to-group",
    {
      showAnchorOffsets: true,
      showPcbGroups: true,
    },
  )
})

test("pcb_component positioned relative to pcb_board shows anchor offsets", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <resistor
        name="R1"
        pcbX={1.5}
        pcbY={2.5}
        footprint="0402"
        resistance="1k"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(
    import.meta.path + "-component-to-board",
    {
      showAnchorOffsets: true,
      showPcbGroups: true,
    },
  )
})
