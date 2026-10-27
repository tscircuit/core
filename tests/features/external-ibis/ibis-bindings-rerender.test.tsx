import { expect, test } from "bun:test"
import type { IbisModel } from "lib/components/primitive-components/IbisModel"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("changing an IBIS model reruns binding validation and permits corrections", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <chip
        name="U1"
        footprint="soic4"
        pinLabels={{ pin1: "DATA", pin2: "OTHER" }}
      />
      <analog.transientsimulation
        name="run"
        spiceEngine="pcb_spice"
        duration="20ns"
        ibisPinStates={{ ".U1 > .DATA": { isOutput: false } }}
      />
      <ibismodel
        componentRef=".U1"
        ibisModelAsset={{
          project_relative_path: "models/model.ibs",
          url: "https://example.com/model.ibs",
          mimetype: "text/plain",
        }}
        ibisComponentName="BUFFER"
        ibisPinNameToPortLabel={{ "1": "DATA" }}
        modelValueCorner="typical"
        includePackageParasitics={false}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const model = circuit.selectOne("ibismodel") as IbisModel
  const modelId = model.simulation_ibis_model_id!

  model.setProps({
    ...model.props,
    ibisPinNameToPortLabel: { "1": "OTHER" },
  })
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'pin ".U1 > .DATA" requires exactly one IBIS model binding',
  )

  model.setProps({ ...model.props, ibisPinNameToPortLabel: { "1": "DATA" } })
  await circuit.renderUntilSettled()
  expect(model.simulation_ibis_model_id).toBe(modelId)
  expect(circuit.db.simulation_ibis_model.list()).toHaveLength(1)
  expect(
    circuit.db.simulation_ibis_model.get(modelId)!
      .ibis_pin_name_to_source_port_id["1"],
  ).toBe(circuit.db.simulation_ibis_pin_state.list()[0].source_port_id)

  model.shouldBeRemoved = true
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'pin ".U1 > .DATA" requires exactly one IBIS model binding',
  )
  expect(circuit.db.simulation_ibis_model.list()).toHaveLength(0)
})
