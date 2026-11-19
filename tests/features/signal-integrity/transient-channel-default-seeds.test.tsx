import { expect, test } from "bun:test"
import { simulation } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("PRBS7 channels in different runs get distinct default seeds", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board fabricatorPreset="jlcpcb_standard" routeRemaining={false}>
      <chip name="U1" footprint="soic8" />
      <trace from=".U1 > .pin1" to=".U1 > .pin2" />
      <trace from=".U1 > .pin3" to=".U1 > .pin4" />
      <simulation.ibismodel
        componentRef=".U1"
        ibisModelAsset={{
          url: "./synthetic.ibs",
          project_relative_path: "synthetic.ibs",
          mimetype: "text/plain",
        }}
        ibisComponentName="U1"
        ibisPinNameToPortLabel={{
          "1": "pin1",
          "2": "pin2",
          "3": "pin3",
          "4": "pin4",
        }}
      />
      <simulation.pcbtransientchannelsimulation
        name="LINK_A"
        bitRate="100Mbps"
        allowUnroutedTraces
      >
        <simulation.pcbdriverreceiverchannel
          name="DATA_A"
          driverRef=".U1 > .pin1"
          receiverRef=".U1 > .pin2"
          pattern="prbs7"
        />
      </simulation.pcbtransientchannelsimulation>
      <simulation.pcbtransientchannelsimulation
        name="LINK_B"
        bitRate="100Mbps"
        allowUnroutedTraces
      >
        <simulation.pcbdriverreceiverchannel
          name="DATA_B"
          driverRef=".U1 > .pin3"
          receiverRef=".U1 > .pin4"
          pattern="prbs7"
        />
      </simulation.pcbtransientchannelsimulation>
    </board>,
  )
  await circuit.renderUntilSettled()

  const [first, second] =
    circuit.db.simulation_pcb_driver_receiver_channel.list()
  expect(first.seed).toBeGreaterThan(0)
  expect(second.seed).toBeGreaterThan(0)
  expect(first.seed).not.toEqual(second.seed)
})
