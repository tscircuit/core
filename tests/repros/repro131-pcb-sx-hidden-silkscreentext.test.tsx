import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const Repro = () => (
  <board width="10mm" height="10mm">
    <resistor
      resistance="1k"
      footprint="0402"
      name="R1"
      pcbSx={{
        "& silkscreentext": {
          visibility: "hidden",
        },
      }}
    />
  </board>
)

test("repro131 pcbSx hidden silkscreentext", () => {
  const { circuit } = getTestFixture()

  circuit.add(<Repro />)
  circuit.render()

  expect(circuit.db.pcb_silkscreen_text.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
