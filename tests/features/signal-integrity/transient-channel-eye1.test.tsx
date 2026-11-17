import { expect, test } from "bun:test"
import { simulation } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("eye window in UI resolves to milliseconds at the channel bit rate", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={24}
      fabricatorPreset="jlcpcb_standard"
      height={12}
      routeRemaining={false}
      schematicDisabled
    >
      <simulation.eyediagram
        name="eye"
        simulationRef="LINK"
        startTime="4UI"
        endTime={80e-9}
      />
      <chip
        name="DRIVER"
        pcbX={-6}
        footprint="soic8"
        pinLabels={{ pin1: "DATA" }}
      />
      <chip
        name="RECEIVER"
        pcbX={6}
        footprint="soic8"
        pinLabels={{ pin1: "DATA" }}
      />
      <simulation.ibismodel
        componentRef=".DRIVER"
        ibisModelAsset={{
          url: "./synthetic.ibs",
          project_relative_path: "synthetic.ibs",
          mimetype: "text/plain",
        }}
        ibisComponentName="DRIVER"
        ibisPinNameToPortLabel={{ "1": "DATA" }}
      />
      <simulation.ibismodel
        componentRef=".RECEIVER"
        ibisModelAsset={{
          url: "./synthetic.ibs",
          project_relative_path: "synthetic.ibs",
          mimetype: "text/plain",
        }}
        ibisComponentName="RECEIVER"
        ibisPinNameToPortLabel={{ "1": "DATA" }}
      />
      <trace
        from=".DRIVER > .DATA"
        to=".RECEIVER > .DATA"
        pcbPath={[".DRIVER > .DATA", ".RECEIVER > .DATA"]}
      />
      <pcbnotetext text="DRIVER → RECEIVER (DATA)" pcbY={-4} fontSize={0.9} />
      <simulation.pcbtransientchannelsimulation name="LINK" bitRate="100Mbps">
        <simulation.pcbdriverreceiverchannel
          name="DATA"
          driverRef=".DRIVER > .DATA"
          receiverRef=".RECEIVER > .DATA"
          offset="2UI"
        />
      </simulation.pcbtransientchannelsimulation>
    </board>,
  )
  await circuit.renderUntilSettled()

  const [channel] = circuit.db.simulation_pcb_driver_receiver_channel.list()
  expect(channel.offset_ms).toBeCloseTo(0.00002, 12)
  const [eye] = circuit.db.simulation_eye_diagram.list()
  expect(eye.simulation_pcb_driver_receiver_channel_ids).toBeUndefined()
  expect(eye.start_time_ms).toBeCloseTo(0.00004, 12)
  expect(eye.end_time_ms).toBeCloseTo(0.00008, 12)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
