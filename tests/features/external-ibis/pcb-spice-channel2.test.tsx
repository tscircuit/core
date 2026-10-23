import { expect, test } from "bun:test"
import { getPcbSpiceChannelFixture } from "tests/fixtures/get-pcb-spice-channel-fixture"

test("PCB SPICE preserves the IBIS asset digest", async () => {
  const { circuit, sha256 } = await getPcbSpiceChannelFixture()
  expect(
    circuit.db.simulation_ibis_model.list()[0].ibis_model_asset.sha256,
  ).toBe(sha256)
})
