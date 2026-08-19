import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const MosfetSymbol = () => (
  <symbol name="MosfetSymbol" width={2.4} height={2.4}>
    <schematicrect
      schX={0}
      schY={0}
      width={1.2}
      height={1.2}
      strokeWidth={0.05}
    />
    <schematictext
      text="S1/S2/S3 internally connected"
      schX={0}
      schY={-1.1}
      fontSize={0.18}
      anchor="center"
    />
    <port
      name="pin1"
      pinNumber={1}
      aliases={["S3"]}
      direction="down"
      schX={-0.4}
      schY={-0.8}
      schStemLength={0.2}
    />
    <port
      name="pin2"
      pinNumber={2}
      aliases={["S2"]}
      direction="down"
      schX={0}
      schY={-0.8}
      schStemLength={0.2}
    />
    <port
      name="pin3"
      pinNumber={3}
      aliases={["S1"]}
      direction="down"
      schX={0.4}
      schY={-0.8}
      schStemLength={0.2}
    />
    <port
      name="pin4"
      pinNumber={4}
      aliases={["G"]}
      direction="left"
      schX={-0.8}
      schY={0}
      schStemLength={0.2}
    />
    <port
      name="pin5"
      pinNumber={5}
      aliases={["D"]}
      direction="up"
      schX={0}
      schY={0.8}
      schStemLength={0.2}
    />
  </symbol>
)

test.failing("custom symbol ports support internallyConnectedPins", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="12mm">
      <chip
        name="U1"
        pinLabels={{
          pin1: ["S3"],
          pin2: ["S2"],
          pin3: ["S1"],
          pin4: ["G"],
          pin5: ["D"],
        }}
        internallyConnectedPins={[[1, 2, 3]]}
        symbol={<MosfetSymbol />}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={-2}
              pcbY={0}
              width={0.6}
              height={1}
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={-1}
              pcbY={0}
              width={0.6}
              height={1}
              shape="rect"
            />
            <smtpad
              portHints={["pin3"]}
              pcbX={0}
              pcbY={0}
              width={0.6}
              height={1}
              shape="rect"
            />
            <smtpad
              portHints={["pin4"]}
              pcbX={1}
              pcbY={0}
              width={0.6}
              height={1}
              shape="rect"
            />
            <smtpad
              portHints={["pin5"]}
              pcbX={2}
              pcbY={0}
              width={0.6}
              height={1}
              shape="rect"
            />
          </footprint>
        }
      />
      <trace from=".U1 > .S3" to="net.SOURCE" />
      <trace from=".U1 > .G" to="net.GATE" />
      <trace from=".U1 > .D" to="net.DRAIN" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourcePortsById = new Map(
    circuit.db.source_port
      .list()
      .map((sourcePort) => [sourcePort.source_port_id, sourcePort]),
  )
  const internalConnections =
    circuit.db.source_component_internal_connection.list()

  expect(internalConnections).toHaveLength(1)
  expect(
    internalConnections[0].source_port_ids
      .map((sourcePortId) => sourcePortsById.get(sourcePortId)?.pin_number)
      .sort((pinNumberA, pinNumberB) =>
        pinNumberA !== undefined && pinNumberB !== undefined
          ? pinNumberA - pinNumberB
          : 0,
      ),
  ).toEqual([1, 2, 3])
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
