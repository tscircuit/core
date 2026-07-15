import { expect, test } from "bun:test"
import type { Shell } from "lib/components/primitive-components/Shell"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("shell supports heterogeneous unit component types", () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board width="30mm" height="20mm">
      <shell name="U1" pinCount={4}>
        <resistor
          unitId="A"
          resistance="1k"
          schX={-5}
          pinMapping={{ pin1: "1", pin2: "2" }}
        />
        <diode unitId="B" schX={5} pinMapping={{ anode: "3", cathode: "4" }} />
      </shell>
      <schematictext
        text="U1 contains heterogeneous resistor and diode units"
        schY={5}
        fontSize={0.5}
      />
    </board>,
  )

  circuit.render()

  const shell = circuit.selectOne(".U1") as Shell
  expect(shell.pinMap()).toEqual({
    "1": "U1A.pin1",
    "2": "U1A.pin2",
    "3": "U1B.anode",
    "4": "U1B.cathode",
  })
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    drawPorts: true,
  })
})
