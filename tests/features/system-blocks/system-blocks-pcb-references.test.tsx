import { expect, test } from "bun:test"
import { systemblock } from "lib"
import { convertCircuitJsonToSystemSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("PCB associations resolve literal names in the owning or explicit subcircuit", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      name="main"
      width={60}
      height={40}
      routingDisabled
      schLayout={{ layoutMode: "none" }}
    >
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={-15} />
      <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX={-12} />
      <group name="power" subcircuit pcbX={12}>
        <resistor name="R1" resistance="1k" footprint="0402" />
        <systemblock.page name="power-detail">
          <systemblock.component
            name="R1"
            displayName="Local power resistor"
            pcbComponentName="R1"
          />
        </systemblock.page>
      </group>
      <systemblock.page name="overview">
        <systemblock.group
          name="power"
          displayName="Power subsystem"
          pcbSubcircuitName="power"
        >
          <systemblock.component
            name="resistor"
            displayName="Power resistor"
            pcbComponentName="R1"
            pcbSubcircuitName="power"
          />
        </systemblock.group>
        <systemblock.group
          name="filter"
          displayName="Input filtering"
          pcbComponentNames={["R1", "C1"]}
        >
          <systemblock.component
            name="R1"
            displayName="Input filter"
            pcbComponentNames={["R1", "C1", "R1"]}
          />
        </systemblock.group>
        <systemblock.connection
          from="resistor"
          to="R1"
          label="Filtered supply"
          kind="power"
        />
      </systemblock.page>
    </board>,
  )
  await circuit.renderUntilSettled()
  const overview = circuit.db.system_block_page
    .list()
    .find((page) => page.name === "overview")!
  const blocks = circuit.db.system_block_component.list()
  const resistor = blocks.find((block) => block.name === "resistor")!
  const filter = blocks.find(
    (block) =>
      block.system_block_page_id === overview.system_block_page_id &&
      block.name === "R1",
  )!
  const local = blocks.find(
    (block) => block.system_block_page_id !== overview.system_block_page_id,
  )!
  expect(resistor.pcb_component_ids).toEqual(local.pcb_component_ids)
  expect(filter.pcb_component_ids).toHaveLength(2)
  expect(filter.pcb_component_ids).not.toContain(resistor.pcb_component_ids![0])
  expect(circuit.db.pcb_group.get(resistor.pcb_group_id!)!.name).toBe("power")
  expect(
    circuit.db.system_block_group
      .list()
      .find((group) => group.name === "power")!.pcb_group_id,
  ).toBe(resistor.pcb_group_id)
  expect(
    circuit.db.system_block_group
      .list()
      .find((group) => group.name === "filter")!.pcb_component_ids,
  ).toEqual(filter.pcb_component_ids)
  expect(circuit.db.source_trace.list()).toHaveLength(0)
  await expect(
    convertCircuitJsonToSystemSvg(circuit.getCircuitJson(), {
      systemBlockPageId: overview.system_block_page_id,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
