import type { PcbSpiceChannelProps } from "@tscircuit/props"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "./get-test-fixture"

export function getPcbSpiceChannelSelectorFixture(
  change: Partial<PcbSpiceChannelProps>,
) {
  const channel: PcbSpiceChannelProps = {
    reduction: "routed-copper",
    sections: 1,
    lanes: [{ name: "DQ0", from: ".U1 > .pin1", to: ".U2 > .pin1" }],
    referencePinRef: ".U1 > .pin2",
    extraction: {
      minimumFrequency: 1,
      maximumFrequency: 1e9,
      modelFrequency: 1e8,
      filaments: 1,
      refinementFilaments: 2,
      convergenceTolerance: 0.01,
      capacitanceTolerance: 0.01,
      reciprocityTolerance: 0.01,
      dcResistanceTolerance: 0.01,
      maxPanelLength: 0.1,
      groundMeshSize: 0.5,
    },
  }
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <chip name="U1" footprint="soic4" />
      <chip name="U2" footprint="soic4" />
      <subcircuit name="nested">
        <resistor name="RREMOTE" footprint="0402" resistance="50" />
      </subcircuit>
      <analog.transientsimulation
        spiceEngine="pcb_spice"
        pcbSpiceChannel={{ ...channel, ...change }}
      />
    </board>,
  )
  return { circuit }
}
