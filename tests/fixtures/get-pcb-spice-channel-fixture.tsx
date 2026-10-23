import type { AnalogTransientSimulation } from "lib/components/primitive-components/AnalogTransientSimulation"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "./get-test-fixture"

export async function getPcbSpiceChannelFixture() {
  const { circuit } = getTestFixture()
  const sha256 = "Ab01".repeat(16)
  circuit.add(
    <board width="30mm" height="15mm" routingDisabled>
      <chip
        name="U1"
        footprint="soic4"
        pcbX={-7}
        pinLabels={{ pin1: "DATA", pin2: "GND" }}
      />
      <chip
        name="U2"
        footprint="soic4"
        pcbX={7}
        pinLabels={{ pin1: "DATA", pin2: "GND" }}
      />
      <resistor name="RTERM" footprint="0402" resistance="50" pcbY={-4} />
      <trace from=".U1 > .DATA" to=".U2 > .DATA" />
      <voltagesource
        name="V1"
        voltage="1.5V"
        connections={{ pin1: ".U1 > .pin1", pin2: ".U1 > .pin2" }}
      />
      <ibismodel
        componentRef=".U1"
        ibisModelAsset={{
          project_relative_path: "models/chip.ibs",
          url: "models/chip.ibs",
          mimetype: "text/plain",
          sha256,
        }}
        ibisComponentName="DRIVER"
        ibisPinNameToPortLabel={{ "1": "DATA" }}
        modelValueCorner="typical"
        includePackageParasitics={false}
      />
      <analog.transientsimulation
        name="channel"
        spiceEngine="pcb_spice"
        duration="20ns"
        pcbSpiceChannel={{
          reduction: "straightened-stages",
          sections: 8,
          lanes: [{ name: "DQ0", from: ".U1 > .DATA", to: ".U2 > .pin1" }],
          referencePinRef: ".U1 > .GND",
          passiveComponentRefs: [".RTERM"],
          extraction: {
            minimumFrequency: "1Hz",
            maximumFrequency: "1GHz",
            modelFrequency: "100MHz",
            filaments: 2,
            refinementFilaments: 4,
            convergenceTolerance: 0.01,
            capacitanceTolerance: 0.02,
            reciprocityTolerance: 0.03,
            dcResistanceTolerance: 0.04,
            maxPanelLength: "0.1mm",
            groundMeshSize: "0.5mm",
          },
          relativePermittivity: 4.2,
          via: {
            platingThickness: "25um",
            equivalentWidth: "0.3mm",
            omitThroughViaStubs: true,
          },
          straightenedStageProfiles: {
            top: {
              spacing: "0.2mm",
              relativePermittivity: 4,
              return: {
                width: "1mm",
                thickness: "35um",
                lengthFactor: 1.1,
                centerY: "-0.2mm",
                centerZ: 0,
              },
            },
          },
        }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const driver = circuit.db.source_component.getWhere({ name: "U1" })!
  const receiver = circuit.db.source_component.getWhere({ name: "U2" })!
  const termination = circuit.db.source_component.getWhere({ name: "RTERM" })!
  const supply = circuit.db.source_component.getWhere({ name: "V1" })!
  const driverPort = circuit.db.source_port.getWhere({
    source_component_id: driver.source_component_id,
    pin_number: 1,
  })!
  const receiverPort = circuit.db.source_port.getWhere({
    source_component_id: receiver.source_component_id,
    pin_number: 1,
  })!
  const groundPort = circuit.db.source_port.getWhere({
    source_component_id: driver.source_component_id,
    pin_number: 2,
  })!
  const experiment = circuit.db.simulation_experiment.list()[0]
  return {
    circuit,
    sha256,
    driverPort,
    receiverPort,
    groundPort,
    termination,
    supply,
    experiment,
    simulation: circuit.selectOne(".channel") as AnalogTransientSimulation,
  }
}
