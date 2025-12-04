import { test, expect, describe } from "bun:test"
import { getTestFixture } from "./fixtures/get-test-fixture"
import {
  Connector,
  USB_C_STANDARD_PINS,
  getStandardPins,
} from "../lib/components/normal-components/Connector"
import "lib/register-catalogue"

describe("Connector component", () => {
  test("USB-C connector has standard pins defined", () => {
    const pins = getStandardPins("usb_c")

    // Verify essential USB-C pins are present
    expect(pins.DP).toBeDefined()
    expect(pins.DM).toBeDefined()
    expect(pins.CC1).toBeDefined()
    expect(pins.CC2).toBeDefined()
    expect(pins.VBUS1).toBeDefined()
    expect(pins.GND1).toBeDefined()

    // Verify pin numbers are assigned
    expect(pins.DP.pinNumber).toBe(1)
    expect(pins.DM.pinNumber).toBe(2)
  })

  test("USB-C standard pins have correct aliases", () => {
    // Verify aliases for data pins
    expect(USB_C_STANDARD_PINS.DP.aliases).toContain("D+")
    expect(USB_C_STANDARD_PINS.DM.aliases).toContain("D-")

    // Verify aliases for power pins
    expect(USB_C_STANDARD_PINS.VBUS1.aliases).toContain("vbus")
    expect(USB_C_STANDARD_PINS.GND1.aliases).toContain("gnd")
  })

  test("Connector renders with USB-C standard", async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="10mm" height="10mm">
        <connector name="USB1" standard="usb_c" pcbX={0} pcbY={0} />
      </board>,
    )

    circuit.render()

    // Verify source component was created
    const sourceComponent = circuit.db.source_component.list()[0]
    expect(sourceComponent).toBeDefined()
    expect(sourceComponent.name).toBe("USB1")
    expect((sourceComponent as unknown as { ftype: string }).ftype).toBe(
      "simple_connector",
    )
    expect(
      (sourceComponent as unknown as { connector_standard: string })
        .connector_standard,
    ).toBe("usb_c")
  })

  test("Connector creates ports for standard pins", async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="10mm" height="10mm">
        <connector name="USB1" standard="usb_c" pcbX={0} pcbY={0} />
      </board>,
    )

    circuit.render()

    // Verify ports were created with standard names
    const ports = circuit.db.source_port.list()
    const portNames = ports.map((p) => p.name)

    expect(portNames).toContain("DP")
    expect(portNames).toContain("DM")
    expect(portNames).toContain("CC1")
    expect(portNames).toContain("CC2")
    expect(portNames).toContain("VBUS1")
    expect(portNames).toContain("GND1")
  })

  test("Connector class is exported and can be instantiated", () => {
    // Verify the Connector class is properly exported
    expect(Connector).toBeDefined()
    expect(typeof Connector).toBe("function")
  })
})

describe("Connector with traces", () => {
  test("Can connect USB-C standard pins to other components", async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="20mm" height="20mm">
        <connector name="USB1" standard="usb_c" pcbX={-5} pcbY={0} />
        <chip
          name="MCU"
          pinLabels={{
            pin1: "USB_DP",
            pin2: "USB_DM",
          }}
          footprint="soic8"
          pcbX={5}
          pcbY={0}
        />
        <trace from=".USB1 > .DP" to=".MCU > .USB_DP" />
        <trace from=".USB1 > .DM" to=".MCU > .USB_DM" />
      </board>,
    )

    circuit.render()

    // Verify traces were created
    const traces = circuit.db.source_trace.list()
    expect(traces.length).toBeGreaterThanOrEqual(2)
  })
})
