import { expect, test } from "bun:test"
import { simulation } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("one eye diagram splits by channel bit rate", async () => {
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

  const [data, fast] = circuit.db.simulation_pcb_driver_receiver_channel.list()
  const [dataEye, fastEye] = circuit.db.simulation_eye_diagram.list()
  expect(dataEye.simulation_pcb_driver_receiver_channel_ids).toEqual([
    data.simulation_pcb_driver_receiver_channel_id,
  ])
  expect(dataEye.start_time_ms).toBeCloseTo(0.00004, 12)
  expect(fastEye.simulation_pcb_driver_receiver_channel_ids).toEqual([
    fast.simulation_pcb_driver_receiver_channel_id,
  ])
  expect(fastEye.start_time_ms).toBeCloseTo(0.00002, 12)
})
