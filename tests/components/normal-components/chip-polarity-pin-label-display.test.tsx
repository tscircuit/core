import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip displays _POS and _NEG pin label suffixes as polarity symbols", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <schematictext
        text="IN_POS displays as IN+ and IN_NEG displays as IN-"
        schX={0}
        schY={2}
        fontSize={0.18}
      />
      <chip
        name="U1"
        pinLabels={{
          pin1: "IN_POS",
          pin2: "IN_NEG",
        }}
      />
    </board>,
  )

  circuit.render()

  expect(circuit.selectOne("U1.IN_POS")).toBeTruthy()
  expect(circuit.selectOne("U1.IN_NEG")).toBeTruthy()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
