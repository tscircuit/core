import { expect, test } from "bun:test"
import { getPcbSpiceChannelFixture } from "tests/fixtures/get-pcb-spice-channel-fixture"

test("PCB SPICE channel can be removed from an existing experiment", async () => {
  const { circuit, simulation } = await getPcbSpiceChannelFixture()
  simulation.setProps({ ...simulation.props, pcbSpiceChannel: undefined })
  await circuit.renderUntilSettled()
  expect(
    circuit.db.simulation_experiment.list()[0].pcb_spice_channel,
  ).toBeUndefined()
})
