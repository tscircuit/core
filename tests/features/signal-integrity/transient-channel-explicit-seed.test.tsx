import { expect, test } from "bun:test"
import { simulation } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a seed set on the channel is written unchanged", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board fabricatorPreset="jlcpcb_standard" routeRemaining={false}>
      <chip name="U1" footprint="soic8" />
      <trace from=".U1 > .pin1" to=".U1 > .pin2" />
      <simulation.ibismodel
        componentRef=".U1"
        ibisModelAsset={{
          url: "./synthetic.ibs",
          project_relative_path: "synthetic.ibs",
          mimetype: "text/plain",
        }}
        ibisComponentName="U1"
        ibisPinNameToPortLabel={{ "1": "pin1", "2": "pin2" }}
      />
      <simulation.pcbtransientchannelsimulation
        name="LINK"
        bitRate="100Mbps"
        allowUnroutedTraces
      >
        <simulation.pcbdriverreceiverchannel
          name="DATA"
          driverRef=".U1 > .pin1"
          receiverRef=".U1 > .pin2"
          pattern="prbs7"
          seed={42}
        />
      </simulation.pcbtransientchannelsimulation>
    </board>,
  )
  await circuit.renderUntilSettled()

  const [channel] = circuit.db.simulation_pcb_driver_receiver_channel.list()
  expect(channel.seed).toBe(42)
})
