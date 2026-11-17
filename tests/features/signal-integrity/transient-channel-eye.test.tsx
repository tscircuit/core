import { expect, test } from "bun:test"
import {
  simulation_eye_diagram,
  simulation_ibis_model,
  simulation_pcb_driver_receiver_channel,
  simulation_pcb_transient_channel_simulation,
} from "circuit-json"
import { PcbDriverReceiverChannel, simulation } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("PCB transient channels and eye windows resolve to milliseconds", async () => {
  const { circuit } = getTestFixture()
  const pins = { pin1: "DATA", pin2: "FAST", pin3: "QUIET", pin4: "DISABLED" }
  circuit.add(
    <board
      width={24}
      height={16}
      fabricatorPreset="jlcpcb_standard"
      routeRemaining={false}
      schematicDisabled
    >
      <simulation.eyediagram
        name="all"
        simulationRef="LINK"
        startTime="4UI"
        endTime={80e-9}
      />
      <simulation.eyediagram
        name="selected"
        simulationRef="LINK"
        channelRef={["FAST", "QUIET", "DISABLED"]}
        startTime={10e-9}
      />
      <simulation.eyediagram
        name="quiet"
        simulationRef="LINK"
        channelRef={["QUIET", "DISABLED"]}
      />
      <simulation.eyediagram name="default" simulationRef="LINK" />
      <chip name="DRIVER" pcbX={-6} footprint="soic8" pinLabels={pins} />
      <chip name="RECEIVER" pcbX={6} footprint="soic8" pinLabels={pins} />
      {["DRIVER", "RECEIVER"].map((name) => (
        <simulation.ibismodel
          key={name}
          componentRef={`.${name}`}
          ibisModelAsset={{
            url: "./synthetic.ibs",
            project_relative_path: "synthetic.ibs",
            mimetype: "text/plain",
          }}
          ibisComponentName={name}
          ibisPinNameToPortLabel={{
            "1": "DATA",
            "2": "FAST",
            "3": "QUIET",
            "4": "DISABLED",
          }}
        />
      ))}
      {Object.values(pins).map((pin) => (
        <trace
          key={pin}
          from={`.DRIVER > .${pin}`}
          to={`.RECEIVER > .${pin}`}
          pcbPath={[`.DRIVER > .${pin}`, `.RECEIVER > .${pin}`]}
        />
      ))}
      <pcbnotetext
        text="DATA • FAST • QUIET • DISABLED"
        pcbY={-5}
        fontSize={0.9}
      />
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
        <simulation.pcbdriverreceiverchannel
          name="FAST"
          driverRef=".DRIVER > .FAST"
          receiverRef=".RECEIVER > .FAST"
          bitRate="200Mbps"
          offset={4e-9}
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
  const { db } = circuit
  expect(
    db.simulation_ibis_model
      .list()
      .map((model) => simulation_ibis_model.safeParse(model).success),
  ).toEqual([true, true])

  const [block] = db.simulation_pcb_transient_channel_simulation
    .list()
    .map((run) => simulation_pcb_transient_channel_simulation.parse(run))
  expect(block.duration_ms).toBeCloseTo(0.00016, 12)
  const [data, fast, quiet, disabled] =
    db.simulation_pcb_driver_receiver_channel
      .list({
        simulation_pcb_transient_channel_simulation_id:
          block.simulation_pcb_transient_channel_simulation_id,
      })
      .map((channel) => simulation_pcb_driver_receiver_channel.parse(channel))
  expect([data.name, fast.name, quiet.name, disabled.name]).toEqual([
    "DATA",
    "FAST",
    "QUIET",
    "DISABLED",
  ])
  expect(data.offset_ms).toBeCloseTo(0.00002, 12)
  expect(data.driver).toMatchObject({ ibis_model_name: "OUT" })
  expect(fast.offset_ms).toBeCloseTo(0.000004, 12)
  expect(disabled.driver_disabled).toBe(true)

  const dataId = data.simulation_pcb_driver_receiver_channel_id
  const fastId = fast.simulation_pcb_driver_receiver_channel_id
  const eyes = () =>
    db.simulation_eye_diagram
      .list()
      .map((eye) => simulation_eye_diagram.parse(eye))
  const [dataEye, fastEye] = eyes().filter((eye) => eye.name === "all")
  expect(dataEye.simulation_pcb_driver_receiver_channel_ids).toEqual([dataId])
  expect(dataEye.start_time_ms).toBeCloseTo(0.00004, 12)
  expect(fastEye.simulation_pcb_driver_receiver_channel_ids).toEqual([fastId])
  expect(fastEye.start_time_ms).toBeCloseTo(0.00002, 12)
  expect(fastEye.end_time_ms).toBeCloseTo(0.00008, 12)
  expect(fastEye.simulation_pcb_transient_channel_simulation_id).toBe(
    block.simulation_pcb_transient_channel_simulation_id,
  )
  expect(eyes().find((eye) => eye.name === "selected")).toMatchObject({
    simulation_pcb_driver_receiver_channel_ids: [fastId],
    start_time_ms: 0.00001,
  })
  expect(eyes().find((eye) => eye.name === "quiet")).toBeUndefined()
  expect(
    eyes().find((eye) => eye.name === "default")
      ?.simulation_pcb_driver_receiver_channel_ids,
  ).toBeUndefined()

  const fastComponent =
    circuit.firstChild!.selectOne<PcbDriverReceiverChannel>(".LINK > .FAST")
  expect(fastComponent).toBeInstanceOf(PcbDriverReceiverChannel)
  fastComponent!.setProps({ ...fastComponent!.props, bitRate: "100Mbps" })
  await circuit.renderUntilSettled()
  const updated = eyes().filter((eye) => eye.name === "all")
  expect(updated).toHaveLength(1)
  expect(updated[0].simulation_eye_diagram_id).toBe(
    dataEye.simulation_eye_diagram_id,
  )
  expect(updated[0].simulation_pcb_driver_receiver_channel_ids).toBeUndefined()
  expect(updated[0].start_time_ms).toBeCloseTo(0.00004, 12)
  expect(
    db.simulation_pcb_driver_receiver_channel.get(fastId)?.bit_rate_bps,
  ).toBe(100_000_000)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
