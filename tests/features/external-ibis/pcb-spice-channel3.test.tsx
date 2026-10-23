import { expect, test } from "bun:test"
import { getPcbSpiceChannelFixture } from "tests/fixtures/get-pcb-spice-channel-fixture"

test("PCB SPICE channel updates preserve the existing experiment", async () => {
  const { circuit, experiment, simulation } = await getPcbSpiceChannelFixture()
  simulation.setProps({
    ...simulation.props,
    pcbSpiceChannel: {
      ...simulation.props.pcbSpiceChannel!,
      reduction: "routed-copper",
      sections: 128,
    },
  })
  await circuit.renderUntilSettled()
  expect(circuit.db.simulation_experiment.list()).toHaveLength(1)
  expect(circuit.db.simulation_experiment.list()[0]).toMatchObject({
    simulation_experiment_id: experiment.simulation_experiment_id,
    pcb_spice_channel: { reduction: "routed-copper", sections: 128 },
  })
})
