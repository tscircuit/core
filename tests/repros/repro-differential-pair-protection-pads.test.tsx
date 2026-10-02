import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// U1 represents two flow-through ESD pads per net, not a complete device.
// Reproduces current failure; this test does not endorse rejecting this topology.
test("repro: differential pair with protection pads fails during length matching", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={12} schAutoLayoutEnabled autorouter="auto_local">
      <pcbnotetext
        pcbY={4}
        fontSize={0.65}
        text="Repro: 4 terminals per differential net"
      />
      <schematicsection name="Source" />
      <schematicsection name="Protection" />
      <schematicsection name="Receiver" />
      <chip
        name="U1"
        schSectionName="Protection"
        pcbX={0}
        pinLabels={{ pin1: "P_IN", pin2: "N_IN", pin3: "P_OUT", pin4: "N_OUT" }}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              portHints={["pin1"]}
              pcbX={-1}
              pcbY={1}
              width={0.6}
              height={0.6}
            />
            <smtpad
              shape="rect"
              portHints={["pin2"]}
              pcbX={-1}
              pcbY={-1}
              width={0.6}
              height={0.6}
            />
            <smtpad
              shape="rect"
              portHints={["pin3"]}
              pcbX={1}
              pcbY={1}
              width={0.6}
              height={0.6}
            />
            <smtpad
              shape="rect"
              portHints={["pin4"]}
              pcbX={1}
              pcbY={-1}
              width={0.6}
              height={0.6}
            />
          </footprint>
        }
      />
      <pinheader
        name="J1"
        schSectionName="Source"
        pinCount={2}
        pitch={2}
        pcbX={-8}
        pcbRotation={90}
      />
      <pinheader
        name="J2"
        schSectionName="Receiver"
        pinCount={2}
        pitch={2}
        pcbX={8}
        pcbRotation={90}
      />
      <trace from=".J1 > .pin1" to="net.P" />
      <trace from=".U1 > .pin1" to="net.P" />
      <trace from=".U1 > .pin3" to="net.P" />
      <trace from=".J2 > .pin1" to="net.P" />
      <trace from=".J1 > .pin2" to="net.N" />
      <trace from=".U1 > .pin2" to="net.N" />
      <trace from=".U1 > .pin4" to="net.N" />
      <trace from=".J2 > .pin2" to="net.N" />
      <differentialpair
        name="PAIR"
        positiveConnection=".J1 > .pin1"
        negativeConnection=".J1 > .pin2"
        maxLengthSkew={0.15}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([
    expect.objectContaining({
      message: expect.stringContaining(
        "must resolve to exactly one final point-pair connection, got 3",
      ),
    }),
  ])
  expect(circuit.db.source_property_ignored_warning.list()).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        property_name: "positiveConnection",
        message: expect.stringContaining("found 4"),
      }),
      expect.objectContaining({
        property_name: "negativeConnection",
        message: expect.stringContaining("found 4"),
      }),
    ]),
  )
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 60_000)
