import { expect, test } from "bun:test"
import { simulation } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("eye diagrams skip quiet and disabled channels", async () => {
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
        name="selected"
        simulationRef="LINK"
        channelRef={["DATA", "QUIET", "DISABLED"]}
      />
      <simulation.eyediagram
        name="quiet"
        simulationRef="LINK"
        channelRef={["QUIET", "DISABLED"]}
      />
      <chip
        name="DRIVER"
        pcbX={-6}
        footprint="soic8"
        pinLabels={{ pin1: "DATA", pin2: "QUIET", pin3: "DISABLED" }}
      />
      <chip
        name="RECEIVER"
        pcbX={6}
        footprint="soic8"
        pinLabels={{ pin1: "DATA", pin2: "QUIET", pin3: "DISABLED" }}
      />
      <simulation.ibismodel
        componentRef=".DRIVER"
        ibisModelAsset={{
          url: "./synthetic.ibs",
          project_relative_path: "synthetic.ibs",
          mimetype: "text/plain",
        }}
        ibisComponentName="DRIVER"
        ibisPinNameToPortLabel={{ "1": "DATA", "2": "QUIET", "3": "DISABLED" }}
      />
      <simulation.ibismodel
        componentRef=".RECEIVER"
        ibisModelAsset={{
          url: "./synthetic.ibs",
          project_relative_path: "synthetic.ibs",
          mimetype: "text/plain",
        }}
        ibisComponentName="RECEIVER"
        ibisPinNameToPortLabel={{ "1": "DATA", "2": "QUIET", "3": "DISABLED" }}
      />
      <trace
        from=".DRIVER > .DATA"
        to=".RECEIVER > .DATA"
        pcbPath={[".DRIVER > .DATA", ".RECEIVER > .DATA"]}
      />
      <trace
        from=".DRIVER > .QUIET"
        to=".RECEIVER > .QUIET"
        pcbPath={[".DRIVER > .QUIET", ".RECEIVER > .QUIET"]}
      />
      <trace
        from=".DRIVER > .DISABLED"
        to=".RECEIVER > .DISABLED"
        pcbPath={[".DRIVER > .DISABLED", ".RECEIVER > .DISABLED"]}
      />
      <simulation.pcbtransientchannelsimulation name="LINK" bitRate="100Mbps">
        <simulation.pcbdriverreceiverchannel
          name="DATA"
          driverRef=".DRIVER > .DATA"
          receiverRef=".RECEIVER > .DATA"
        />
        <simulation.pcbdriverreceiverchannel
          name="QUIET"
          driverRef=".DRIVER > .QUIET"
          receiverRef=".RECEIVER > .QUIET"
          pattern="111"
        />
        <simulation.pcbdriverreceiverchannel
          name="DISABLED"
          driverRef=".DRIVER > .DISABLED"
          receiverRef=".RECEIVER > .DISABLED"
          driverDisabled
        />
      </simulation.pcbtransientchannelsimulation>
    </board>,
  )
  await circuit.renderUntilSettled()

  const data = circuit.db.simulation_pcb_driver_receiver_channel.getWhere({
    name: "DATA",
  })!
  const eyes = circuit.db.simulation_eye_diagram.list()
  expect(eyes).toHaveLength(1)
  expect(eyes[0].name).toBe("selected")
  expect(eyes[0].simulation_pcb_driver_receiver_channel_ids).toEqual([
    data.simulation_pcb_driver_receiver_channel_id,
  ])
})
