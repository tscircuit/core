import { test, expect } from "bun:test"
import { useLed } from "lib/hooks/use-led"
import { Circuit } from "lib/Circuit"

test("useLed hook creates component with correct props and traces", () => {
  const circuit = new Circuit()

  const LED1 = useLed("LED1", { footprint: "1206" })
  const LED2 = useLed("LED2", { footprint: "0603" })

  circuit.add(
    <board width="10mm" height="10mm">
      <LED1 anode="net.VCC" cathode="net.GND" />
      <LED2 pos={LED1.anode} neg="net.GND" />
    </board>,
  )

  circuit.render()

  // Check if LED components were created correctly
  const leds = circuit.selectAll("led")
  expect(leds.length).toBe(2)
  expect(leds[0].props.name).toBe("LED1")
  expect(leds[0].props.footprint).toBe("1206")
  expect(leds[1].props.name).toBe("LED2")
  expect(leds[1].props.footprint).toBe("0603")

  // Check if traces were created correctly
  const traces = circuit.selectAll("trace")
  expect(traces.length).toBe(4)
})
