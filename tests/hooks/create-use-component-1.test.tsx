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
  const useResistor1 = createUseComponent(
    (props: ResistorProps) => <resistor {...props} />,
    resistorPins,
  )
  const useResistor2 = createUseComponent(
    (props: ResistorProps) => <resistor {...props} />,
    {
      // TODO unfortunately pin1 and pin2 have to be specified because the type
      // inference isn't good enough yet
      pin1: ["pin1", "left"],
      pin2: ["pin2", "right"],
    } as const,
  )
  const useResistor3 = createUseComponent(
    (props: ResistorProps) => <resistor {...props} />,
    [],
  )

  const circuit = new Circuit()

  const R1 = useResistor1("R1", { resistance: "10k", footprint: "0402" })
  const R2 = useResistor2("R2", { resistance: "10k", footprint: "0402" })
  const R3 = useResistor3("R3")

  expectTypesMatch<typeof R1.pin1, string>(true)

  // @ts-expect-error
  const err1 = <R3 />

  circuit.add(
    <board width="10mm" height="10mm">
      <R1 left="net.VCC" pin2="net.GND" />
      <R2 pin1={R1.pin1} pin2="net.GND" />
      <R3 resistance="10k" />
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

  const trace1 = traces.find((t) => /^\.R1 > (port\.|\.)?left$/.test(t.props.from))
  const trace2 = traces.find((t) => /^\.R1 > (port\.|\.)?pin2$/.test(t.props.from))
  console.log(trace1?.props)

  expect(trace1).not.toBeNull()
  expect(trace1?.props.to).toBe("net.VCC")

  expect(trace2).not.toBeNull()
  expect(trace2?.props.to).toBe("net.GND")
})
