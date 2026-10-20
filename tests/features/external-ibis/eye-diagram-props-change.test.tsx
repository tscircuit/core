import { expect, test } from "bun:test"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { AnalogEyeDiagram } from "lib/components/primitive-components/AnalogEyeDiagram"

test("editing an eye updates its exported time origin", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <chip name="U1" footprint="soic4" />
      <ibismodel
        componentRef=".U1"
        ibisModelAsset={{
          project_relative_path: "models/model.ibs",
          url: "https://example.com/model.ibs",
          mimetype: "text/plain",
        }}
        ibisComponentName="BUFFER"
        ibisPinNameToPortLabel={{ "1": "pin1" }}
        modelValueCorner="typical"
        includePackageParasitics={false}
      />
      <analog.transientsimulation
        name="run"
        spiceEngine="pcb_spice"
        duration="20ns"
        ibisPinStates={{
          ".U1 > .pin1": { isOutput: true, isOutputEnabled: true },
        }}
      />
      <voltageprobe name="probe" connectsTo=".U1 > .pin1" />
      <analog.eyediagram
        name="eye"
        simulationRef=".run"
        probeRef=".probe"
        unitInterval="2ns"
        timeOrigin="0ns"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const eye = circuit.selectOne(".eye") as AnalogEyeDiagram
  eye.setProps({ ...eye.props, timeOrigin: "1ns" })
  await circuit.renderUntilSettled()
  expect(circuit.db.simulation_eye_diagram.list()[0].time_origin_ms).toBe(
    0.000001,
  )
})
