import { expect, test } from "bun:test"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("disabling analog simulation skips invalid IBIS declarations and their records", async () => {
  for (const analogSimulationDisabled of [false, true]) {
    for (const [invalidDeclaration, expectedError] of [
      ["model", "identify one component"],
      ["stimulus", "exactly one physical source pin"],
      ["pin_state", "exactly one physical source pin"],
      ["binding", "requires exactly one IBIS model binding"],
      ["eye", "identify one voltage probe"],
    ]) {
      const { circuit } = getTestFixture({
        platform: { analogSimulationDisabled },
      })
      circuit.add(
        <board routingDisabled>
          <chip name="U1" footprint="soic4" />
          <analog.transientsimulation
            name="run"
            spiceEngine="pcb_spice"
            duration="20ns"
            ibisPinStates={
              invalidDeclaration === "pin_state"
                ? { ".U1 > .missing": { isOutput: false } }
                : invalidDeclaration === "binding"
                  ? { ".U1 > .pin1": { isOutput: false } }
                  : {}
            }
          />
          {invalidDeclaration === "model" && (
            <ibismodel
              componentRef=".missing"
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
          )}
          {invalidDeclaration === "stimulus" && (
            <analog.digitalstimulus
              name="data"
              simulationRef=".run"
              sourcePinRef=".U1 > .missing"
              bitDuration="2ns"
              startTime="0ns"
              initialState={0}
              transmittedData={{
                transmissionType: "bits",
                bits: "01",
                repeat: true,
              }}
            />
          )}
          {invalidDeclaration === "eye" && (
            <analog.eyediagram
              name="eye"
              simulationRef=".run"
              probeRef=".missing"
              unitInterval="2ns"
              timeOrigin="0ns"
            />
          )}
        </board>,
      )
      if (!analogSimulationDisabled) {
        await expect(circuit.renderUntilSettled()).rejects.toThrow(
          expectedError,
        )
        continue
      }

      await circuit.renderUntilSettled()
      expect(circuit.db.pcb_component.list()).toHaveLength(1)
      // Other analog analyses retain experiment metadata when disabled.
      expect(circuit.db.simulation_experiment.list()).toHaveLength(1)
      expect(circuit.db.simulation_ibis_model.list()).toHaveLength(0)
      expect(circuit.db.simulation_ibis_pin_state.list()).toHaveLength(0)
      expect(circuit.db.simulation_digital_stimulus.list()).toHaveLength(0)
      expect(circuit.db.simulation_eye_diagram.list()).toHaveLength(0)
    }
  }
})
