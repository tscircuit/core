import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("subcircuit circuit JSON inflates simple_mosfet components", async () => {
  const subcircuitCircuitJson = await renderToCircuitJson(
    <board width="10mm" height="10mm">
      <mosfet
        name="Q1"
        channelType="n"
        mosfetMode="enhancement"
        footprint="sot23"
      />
    </board>,
  )

  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <subcircuit name="S1" circuitJson={subcircuitCircuitJson} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const mosfet = circuit.db.source_component.getWhere({ name: "Q1" })

  expect(mosfet).toMatchObject({
    ftype: "simple_mosfet",
    channel_type: "n",
    mosfet_mode: "enhancement",
  })
})
