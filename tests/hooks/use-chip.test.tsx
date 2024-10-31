import { test, expect } from "bun:test"
import { useChip } from "lib/hooks/use-chip"
import { Circuit } from "lib/Circuit"

test("useChip hook creates component with correct props and traces", () => {
  const circuit = new Circuit()

  const useAtmega = useChip({
    pin1: ["VCC"],
    pin2: ["GND"],
    pin3: ["TX"],
    pin4: ["RX"],
  } as const)

  const U1 = useAtmega("U1", {
    footprint: "soic8",
    manufacturerPartNumber: "ATMEGA328P",
  })

  circuit.add(
    <board width="10mm" height="10mm">
      <U1 VCC="net.VCC" GND="net.GND" TX="net.TX" RX={U1.TX} />
    </board>,
  )

  circuit.render()

  // Check if chip component was created correctly
  const chip = circuit.selectOne("chip")
  expect(chip).not.toBeNull()
  expect(chip!.props.name).toBe("U1")
  expect(chip!.props.footprint).toBe("soic8")
  expect(chip!.props.manufacturerPartNumber).toBe("ATMEGA328P")

  // Check if traces were created correctly
  const traces = circuit.selectAll("trace")
  expect(traces.length).toBe(4)

  // Verify trace connections
  const traceConnections = traces.map((t) => ({
    from: t.props.from,
    to: t.props.to,
  }))
  expect(traceConnections).toContainEqual({ from: ".U1 > .VCC", to: "net.VCC" })
  expect(traceConnections).toContainEqual({ from: ".U1 > .GND", to: "net.GND" })
  expect(traceConnections).toContainEqual({ from: ".U1 > .TX", to: "net.TX" })
  expect(traceConnections).toContainEqual({
    from: ".U1 > .RX",
    to: ".U1 > .TX",
  })
})
