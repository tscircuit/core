import { expect, test } from "bun:test"
import { PcbDriverReceiverChannel, simulation } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("eye diagram records update when a channel bit rate changes", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={24}
      fabricatorPreset="jlcpcb_standard"
      height={12}
      routeRemaining={false}
      schematicDisabled
    >
      <simulation.eyediagram name="eye" simulationRef="LINK" startTime="4UI" />
      <chip
        name="DRIVER"
        pcbX={-6}
        footprint="soic8"
        pinLabels={{ pin1: "DATA", pin2: "FAST" }}
      />
      <chip
        name="RECEIVER"
        pcbX={6}
        footprint="soic8"
        pinLabels={{ pin1: "DATA", pin2: "FAST" }}
      />
      <simulation.ibismodel
        componentRef=".DRIVER"
        ibisModelAsset={{
          url: "./synthetic.ibs",
          project_relative_path: "synthetic.ibs",
          mimetype: "text/plain",
        }}
        ibisComponentName="DRIVER"
        ibisPinNameToPortLabel={{ "1": "DATA", "2": "FAST" }}
      />
      <simulation.ibismodel
        componentRef=".RECEIVER"
        ibisModelAsset={{
          url: "./synthetic.ibs",
          project_relative_path: "synthetic.ibs",
          mimetype: "text/plain",
        }}
        ibisComponentName="RECEIVER"
        ibisPinNameToPortLabel={{ "1": "DATA", "2": "FAST" }}
      />
      <trace
        from=".DRIVER > .DATA"
        to=".RECEIVER > .DATA"
        pcbPath={[".DRIVER > .DATA", ".RECEIVER > .DATA"]}
      />
      <trace
        from=".DRIVER > .FAST"
        to=".RECEIVER > .FAST"
        pcbPath={[".DRIVER > .FAST", ".RECEIVER > .FAST"]}
      />
      <simulation.pcbtransientchannelsimulation name="LINK" bitRate="100Mbps">
        <simulation.pcbdriverreceiverchannel
          name="DATA"
          driverRef=".DRIVER > .DATA"
          receiverRef=".RECEIVER > .DATA"
        />
        <simulation.pcbdriverreceiverchannel
          name="FAST"
          driverRef=".DRIVER > .FAST"
          receiverRef=".RECEIVER > .FAST"
          bitRate="200Mbps"
        />
      </simulation.pcbtransientchannelsimulation>
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.simulation_eye_diagram.list()).toHaveLength(2)

  const fast =
    circuit.firstChild!.selectOne<PcbDriverReceiverChannel>(".LINK > .FAST")!
  fast.setProps({ ...fast.props, bitRate: "100Mbps" })
  await circuit.renderUntilSettled()

  const eyes = circuit.db.simulation_eye_diagram.list()
  expect(eyes).toHaveLength(1)
  expect(eyes[0].simulation_pcb_driver_receiver_channel_ids).toBeUndefined()
})
