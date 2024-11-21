import { test, expect } from "bun:test"
import { Circuit } from "lib/Circuit"
import { usePinHeader } from "lib/hooks/use-pinheader"

test("usePinheader hook creates component with correct props", () => {
  const circuit = new Circuit()

  const J1 = usePinHeader("J1", {
    pinLabels: ["VCC", "GND", "TX", "RX"],
  })

  const J1Component = J1("J1Component", {
    pinCount: 4,
    pinLabels: ["VCC", "GND", "TX", "RX"],
  })

  circuit.add(
    <board width="10mm" height="10mm">
      <J1Component pin1="net.GND" pin2="net.VCC" pin3="net.TX" pin4="net.RX" />
    </board>,
  )

  circuit.render()

  // Check if pinheader component was created correctly
  const pinheader = circuit.selectOne("pinheader")
  expect(pinheader).not.toBeNull()
  expect(pinheader!.props.name).toBe("J1")
  expect(pinheader!.props.pinCount).toBe(4)
  expect(pinheader!.props.pinLabels).toEqual(["VCC", "GND", "TX", "RX"])
})
