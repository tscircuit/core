import { test, expect } from "bun:test"
import { createUseComponent } from "lib/hooks/create-use-component"
import {
  resistorProps,
  resistorPins,
  type ResistorProps,
} from "@tscircuit/props"
import { Circuit } from "lib/Circuit"
import { Resistor } from "lib/components"
import { expectTypesMatch } from "tests/fixtures/expect-types-match"

test("createUseComponent creates a component with correct props and traces", () => {
  const useResistor = createUseComponent(
    (props: ResistorProps) => <resistor {...props} />,
    resistorPins,
  )

  const circuit = new Circuit()

  const R1 = useResistor("R1", { resistance: "10k", footprint: "0402" })
  const R2 = useResistor("R2", { resistance: "10k", footprint: "0402" })

  expectTypesMatch<typeof R1.pin1, string>(true)

  circuit.add(
    <board width="10mm" height="10mm">
      <R1 pin1="net.VCC" pin2="net.GND" />
      <R2 pin1={R1.pin1} pin2="net.GND" />
    </board>,
  )

  circuit.render()

  // Check if the resistor component was created correctly
  const resistor = circuit.selectOne("resistor")
  expect(resistor).not.toBeNull()
  expect(resistor?.props.name).toBe("R1")
  expect(resistor?.props.resistance).toBe("10k")
  expect(resistor?.props.footprint).toBe("0402")

  // Check if traces were created correctly
  const traces = circuit.selectAll("trace")
  expect(traces.length).toBe(4)

  const trace1 = traces.find((t) => t.props.from === ".R1 > .pin1")
  const trace2 = traces.find((t) => t.props.from === ".R1 > .pin2")

  expect(trace1).not.toBeNull()
  expect(trace1?.props.to).toBe("net.VCC")

  expect(trace2).not.toBeNull()
  expect(trace2?.props.to).toBe("net.GND")
})
