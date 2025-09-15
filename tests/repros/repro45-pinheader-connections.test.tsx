import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

export default test("pinheader connections using labels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <pinheader
        name="J1"
        pinCount={3}
        pinLabels={{ pin1: "VCC", pin2: "OUT", pin3: "GND" }}
        connections={{ VCC: "net.VCC", OUT: "net.OUT", GND: "net.GND" }}
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        connections={{ pin1: "net.OUT", pin2: "net.GND" }}
      />
      <capacitor
        name="C1"
        capacitance="1u"
        footprint="0603"
        connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      />
    </board>,
  )

  await circuit.render()

  const traces = circuit.selectAll("trace").map((t) => ({
    from: t._parsedProps.from,
    to: t._parsedProps.to,
  }))
  for (const label of ["VCC", "OUT", "GND"]) {
    expect(traces.some((t) => t.from.includes(`port.${label}`))).toBe(true)
  }

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
