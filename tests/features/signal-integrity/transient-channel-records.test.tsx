import { expect, test } from "bun:test"
import {
  simulation_pcb_driver_receiver_channel,
  simulation_pcb_transient_channel_simulation,
} from "circuit-json"
import { simulation } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("PCB transient simulation emits a routed driver-to-receiver channel", async () => {
  const { circuit } = getTestFixture()
  const ibisModelAsset = {
    url: "./synthetic.ibs",
    project_relative_path: "synthetic.ibs",
    mimetype: "text/plain" as const,
  }
  circuit.add(
    <board
      width={24}
      height={12}
      fabricatorPreset="jlcpcb_standard"
      routeRemaining={false}
      schematicDisabled
    >
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
        ibisModelAsset={ibisModelAsset}
        ibisComponentName="DRIVER"
        ibisPinNameToPortLabel={{ "1": "DATA" }}
      />
      <simulation.ibismodel
        componentRef=".RECEIVER"
        ibisModelAsset={ibisModelAsset}
        ibisComponentName="RECEIVER"
        ibisPinNameToPortLabel={{ "1": "DATA" }}
      />
      <trace
        from=".DRIVER > .DATA"
        to=".RECEIVER > .DATA"
        pcbPath={[".DRIVER > .DATA", ".RECEIVER > .DATA"]}
      />
      <pcbnotetext text="DRIVER → RECEIVER (DATA)" pcbY={-4} fontSize={0.9} />
      <simulation.pcbtransientchannelsimulation
        name="LINK"
        bitRate="100Mbps"
        duration="16UI"
      >
        <simulation.pcbdriverreceiverchannel
          name="DATA"
          driverRef={{ pin: ".DRIVER > .DATA", model: "OUT" }}
          receiverRef=".RECEIVER > .DATA"
          pattern="01"
          offset="2UI"
        />
      </simulation.pcbtransientchannelsimulation>
    </board>,
  )
  await circuit.renderUntilSettled()

  const [experiment] =
    circuit.db.simulation_pcb_transient_channel_simulation.list()
  const block = simulation_pcb_transient_channel_simulation.parse(experiment)
  const [channel] = circuit.db.simulation_pcb_driver_receiver_channel.list()
  const data = simulation_pcb_driver_receiver_channel.parse(channel)
  const driverModel = circuit.db.simulation_ibis_model.getWhere({
    ibis_component_name: "DRIVER",
  })!
  const receiverModel = circuit.db.simulation_ibis_model.getWhere({
    ibis_component_name: "RECEIVER",
  })!
  expect(data).toMatchObject({
    simulation_pcb_transient_channel_simulation_id:
      block.simulation_pcb_transient_channel_simulation_id,
    name: "DATA",
    driver: {
      ibis_model_name: "OUT",
      source_port_id: driverModel.ibis_pin_name_to_source_port_id["1"],
    },
    receivers: [
      { source_port_id: receiverModel.ibis_pin_name_to_source_port_id["1"] },
    ],
    pattern: "01",
  })
  expect(block.duration_ms).toBeCloseTo(0.00016, 12)
  expect(data.offset_ms).toBeCloseTo(0.00002, 12)
  expect(data.seed).toBeUndefined()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
