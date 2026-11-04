import { expect, test } from "bun:test"
import { systemblock } from "lib"
import { convertCircuitJsonToSystemSvg } from "circuit-to-svg"
import { assertSystemGeometry } from "./assert-system-geometry"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("TSX system blocks resolve nested groups and cross-group interfaces", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <systemblock.page name="overview" displayName="Wireless sensor node">
      <systemblock.group
        name="node"
        displayName="Sensor node"
        description="Collect and transmit environmental readings"
      >
        <systemblock.group
          name="processing"
          displayName="Sensing and processing"
        >
          <systemblock.component
            name="sensor"
            displayName="Environment sensor"
            description="Measures temperature and humidity"
          />
          <systemblock.component
            name="mcu"
            displayName="Microcontroller"
            description="Samples and processes readings"
          />
        </systemblock.group>
        <systemblock.component
          name="radio"
          displayName="Radio module"
          description="Transmits measurements to a gateway"
        />
      </systemblock.group>
      <systemblock.connection
        from="sensor"
        to="mcu"
        label="I2C"
        direction="both"
      />
      <systemblock.connection
        from="mcu"
        to="radio"
        label="SPI"
        direction="both"
      />
    </systemblock.page>,
  )
  circuit.render()
  const json = circuit.getCircuitJson()
  assertSystemGeometry(json)
  const groups = circuit.db.system_block_group.list()
  const processing = groups.find((group) => group.name === "processing")!
  expect(processing.parent_system_block_group_id).toBe(
    groups.find((group) => group.name === "node")!.system_block_group_id,
  )
  for (const block of circuit.db.system_block_component
    .list()
    .filter(
      (block) =>
        block.system_block_group_id === processing.system_block_group_id,
    )) {
    expect(
      Math.abs(block.center.x - processing.center.x) + block.width / 2,
    ).toBeLessThan(processing.width / 2)
    expect(
      Math.abs(block.center.y - processing.center.y) + block.height / 2,
    ).toBeLessThan(processing.height / 2)
  }
  expect(circuit.db.source_component.list()).toHaveLength(0)
  expect(circuit.db.source_trace.list()).toHaveLength(0)
  return expect(convertCircuitJsonToSystemSvg(json)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
