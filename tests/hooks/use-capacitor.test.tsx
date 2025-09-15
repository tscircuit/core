import { test, expect } from "bun:test"
import { useCapacitor } from "lib/hooks/use-capacitor"
import { RootCircuit } from "lib/RootCircuit"

test("useCapacitor hook creates component with correct props and traces", () => {
  const circuit = new RootCircuit()

  const C1 = useCapacitor("C1", { capacitance: "10uF", footprint: "0805" })
  const C2 = useCapacitor("C2", { capacitance: "100nF", footprint: "0603" })

  circuit.add(
    <board width="10mm" height="10mm">
      <C1 neg="net.VCC" pos="net.GND" />
      <C2 pos={C1.pos} neg="net.GND" />
    </board>,
  )

  circuit.render()

  // Check if capacitor components were created correctly
  const capacitors = circuit.selectAll("capacitor")
  expect(capacitors.length).toBe(2)
  expect(capacitors[0].props.name).toBe("C1")
  expect(capacitors[0].props.capacitance).toBe("10uF")
  expect(capacitors[1].props.name).toBe("C2")
  expect(capacitors[1].props.capacitance).toBe("100nF")

  // Check if traces were created correctly
  const traces = circuit.selectAll("trace")
  expect(traces.length).toBe(4)
})
