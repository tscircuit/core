import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  ReturnCurrentConnections,
  returnCurrentExcitationProps,
} from "tests/fixtures/pcb-return-current-board"

test("multiple experiments and excitations resolve identically named ports within their subcircuits", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={12} schematicDisabled>
      {[-5, 5].map((x, index) => (
        <group subcircuit name={`local${index}`} pcbX={x} key={index}>
          <ReturnCurrentConnections />
          <pcbreturncurrentsimulation name={`experiment${index}`}>
            <pcbreturncurrentexcitation {...returnCurrentExcitationProps} />
          </pcbreturncurrentsimulation>
          <pcbreturncurrentsimulation name={`experiment${index}-10mA`}>
            <pcbreturncurrentexcitation
              {...returnCurrentExcitationProps}
              current="10mA"
            />
          </pcbreturncurrentsimulation>
          <pcbnotetext
            text={`experiment${index}: 5 mA / 10 mA`}
            pcbY={-2}
            fontSize={0.4}
          />
        </group>
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()
  const experiments = circuit.db.simulation_experiment.list()
  expect(experiments).toHaveLength(4)
  const excitations = circuit.db.simulation_return_current_excitation.list()
  expect(excitations).toHaveLength(4)
  for (const experiment of experiments) {
    const selected = excitations.filter(
      (excitation) =>
        excitation.simulation_experiment_id ===
        experiment.simulation_experiment_id,
    )
    expect(selected.map((excitation) => excitation.current)).toEqual([
      experiment.name.endsWith("10mA") ? 0.01 : 0.005,
    ])
    const expectedX = experiment.name.startsWith("experiment0") ? -7 : 3
    expect(selected[0].return_sink.x).toBe(expectedX)
  }
  expect(excitations[0].pcb_trace_id).not.toBe(excitations[2].pcb_trace_id)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
