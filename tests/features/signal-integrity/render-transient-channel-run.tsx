import type { PcbTransientChannelSimulationProps } from "@tscircuit/props"
import { simulation } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

export async function renderTransientChannelRun(
  props: Pick<
    PcbTransientChannelSimulationProps,
    "aggressorPattern" | "aggressorDisabled"
  >,
) {
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
        bitRate="100Mbps"
        allowUnroutedTraces
        {...props}
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

  const run = circuit
    .getCircuitJson()
    .find(
      (element) =>
        element.type === "simulation_pcb_transient_channel_simulation",
    )
  if (!run)
    throw new Error("Expected a PCB transient channel simulation record")
  return run
}
