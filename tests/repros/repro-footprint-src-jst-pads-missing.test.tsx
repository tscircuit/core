import { beforeAll, expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()

const getConnectorPads = (name: string) => {
  const connector = circuit.db.source_component.getWhere({ name })!
  const pcbConnector = circuit.db.pcb_component.getWhere({
    source_component_id: connector.source_component_id,
  })!
  return circuit.db.pcb_plated_hole.list({
    pcb_component_id: pcbConnector.pcb_component_id,
  })
}

beforeAll(async () => {
  circuit.add(
    <board width={36} height={18} routingDisabled schematicDisabled>
      <connector
        name="J1"
        pinCount={5}
        pcbX={-8}
        footprint="jst5_zh"
        cadModel={null}
        noConnect={["1", "2", "3", "4", "5"]}
      />
      <connector
        name="J2"
        pinCount={5}
        pcbX={8}
        footprint={<footprint src="jst5_zh" insertionDirection="from_above" />}
        cadModel={null}
        noConnect={["1", "2", "3", "4", "5"]}
      />
      <pcbnotetext
        text="J1: footprint string"
        pcbX={-8}
        pcbY={6}
        fontSize={0.7}
      />
      <pcbnotetext text="J2: footprint src" pcbX={8} pcbY={6} fontSize={0.7} />
      <pcbnotetext text="Both should have five pads" pcbY={-6} fontSize={0.7} />
      <pcbnoterect pcbX={8} width={10} height={4} />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Snapshot and control checks must pass independently of the expected failure.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(getConnectorPads("J1")).toHaveLength(5)
})

test.failing(
  "footprint src generates the same five JST pads as a footprint string",
  () => {
    expect(getConnectorPads("J2")).toHaveLength(5)
  },
)
