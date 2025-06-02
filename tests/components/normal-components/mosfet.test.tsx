import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should render different types of MOSFETs", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" schAutoLayoutEnabled grid gridGap="1mm">
      <mosfet
        name="M1"
        channelType="n"
        mosfetMode="enhancement"
        schRotation={0}
      />

      <mosfet
        name="M2"
        channelType="p"
        mosfetMode="enhancement"
        schRotation={90}
      />

      <mosfet
        name="M3"
        channelType="n"
        mosfetMode="depletion"
        schRotation={180}
      />

      <mosfet
        name="M4"
        channelType="p"
        mosfetMode="depletion"
        schRotation={270}
      />
    </board>,
  )

  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
