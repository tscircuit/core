import { expect, test } from "bun:test"
import { simulation } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("PCB transient simulation records the run settings", async () => {
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
        duration="16UI"
        allowUnroutedTraces
        nearbyDriverPattern="1"
        nearbyDriversDisabled={false}
      >
        <simulation.pcbdriverreceiverchannel
          name="DATA"
          driverRef=".U1 > .pin1"
          receiverRef=".U1 > .pin2"
        />
      </simulation.pcbtransientchannelsimulation>
    </board>,
  )
  await circuit.renderUntilSettled()

  const [run] = circuit.db.simulation_pcb_transient_channel_simulation.list()
  expect(run).toMatchObject({
    name: "LINK",
    bit_rate_bps: 100_000_000,
    allow_unrouted_traces: true,
    nearby_driver_pattern: "1",
    nearby_drivers_disabled: false,
  })
  expect(run.duration_ms).toBeCloseTo(0.00016, 12)
})
