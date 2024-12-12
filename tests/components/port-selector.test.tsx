import { test, expect } from "bun:test"
import { Circuit } from "lib/Circuit"
import { useResistor } from "lib/hooks/use-resistor"
import { useLed } from "lib/hooks/use-led"
import React from "react"

test("Port selector functionality", () => {
  test("should correctly handle port connections between components", () => {
    const circuit = new Circuit()
    const R1 = useResistor("R1", { resistance: "10k", footprint: "0603" })
    const LED1 = useLed("LED1", { footprint: "1206" })

    circuit.add(
      <board width="10mm" height="10mm">
        <R1 pin1="net.VCC" pin2={LED1.anode} />
        <LED1 anode={R1.pin2} cathode="net.GND" />
      </board>,
    )

    circuit.render()

    // Check if components were created correctly
    const resistors = circuit.selectAll("resistor")
    const leds = circuit.selectAll("led")
    expect(resistors.length).toBe(1)
    expect(leds.length).toBe(1)
    expect(resistors[0].props.name).toBe("R1")
    expect(leds[0].props.name).toBe("LED1")

    // Check if traces were created correctly
    const traces = circuit.selectAll("trace")
    expect(traces.length).toBe(3) // VCC->R1, R1->LED1, LED1->GND
  })

  test("should handle net connections", () => {
    const circuit = new Circuit()
    const R1 = useResistor("R1", { resistance: "10k", footprint: "0603" })

    circuit.add(
      <board width="10mm" height="10mm">
        <R1 pin1="net.VCC" pin2="net.GND" />
      </board>,
    )

    circuit.render()

    // Check if traces were created correctly
    const traces = circuit.selectAll("trace")
    expect(traces.length).toBe(2) // VCC->R1, R1->GND
  })

  test("should provide clear error for undefined ports", () => {
    const circuit = new Circuit()
    const R1 = useResistor("R1", { resistance: "10k", footprint: "0603" })

    expect(() =>
      circuit.add(
        <board width="10mm" height="10mm">
          <R1 pin1="net.VCC" pin2="nonexistent.port" />
        </board>,
      ),
    ).toThrow(/Could not find port/)
  })
})
