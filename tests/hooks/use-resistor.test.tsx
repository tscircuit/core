import { test, expect } from "bun:test"
import { useResistor } from "lib/hooks/use-resistor"
import { RootCircuit } from "lib/Circuit"

test("useResistor hook creates component with correct props and traces", () => {
  const circuit = new RootCircuit()

  const R1 = useResistor("R1", { resistance: "10k", footprint: "0402" })
  const R2 = useResistor("R2", { resistance: "20k", footprint: "0603" })

  circuit.add(
    <board width="10mm" height="10mm">
      <R1 pin1="net.VCC" pin2="net.GND" />
      <R2 pin1={R1.pin2} pin2="net.GND" />
    </board>,
  )

  circuit.render()

  // Check if resistor components were created correctly
  const resistors = circuit.selectAll("resistor")
  expect(resistors.length).toBe(2)
  expect(resistors[0].props.name).toBe("R1")
  expect(resistors[0].props.resistance).toBe("10k")
  expect(resistors[1].props.name).toBe("R2")
  expect(resistors[1].props.resistance).toBe("20k")

  // Check if traces were created correctly
  const traces = circuit.selectAll("trace")
  expect(traces.length).toBe(4)
})
