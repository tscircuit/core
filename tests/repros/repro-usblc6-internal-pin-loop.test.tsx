import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("USBLC6 internal pin links do not need redundant PCB copper", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={18} height={18} autorouter="auto_local">
      <pcbnotetext
        text="USBLC6: pins 1 and 6 are connected inside the chip"
        pcbY={7.5}
        fontSize={0.35}
      />
      <pcbnotetext text="D_USB" pcbX={-3.5} pcbY={0} fontSize={0.4} />
      <chip
        name="D_USB"
        manufacturerPartNumber="USBLC6-2SC6"
        supplierPartNumbers={{ jlcpcb: ["C7519"] }}
        pcbRotation={180}
        pinLabels={{
          pin1: "IO1_IN",
          pin2: "GND",
          pin3: "IO2_IN",
          pin4: "IO2_OUT",
          pin5: "VBUS",
          pin6: "IO1_OUT",
        }}
        internallyConnectedPins={[
          ["pin1", "pin6"],
          ["pin3", "pin4"],
        ]}
        connections={{
          pin1: "net.USB_DP",
          pin6: "net.USB_DP",
          pin2: "net.GND",
          pin5: "net.VBUS",
        }}
        // Exact pad geometry from the C7519 footprint used in UART Dock.
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={-0.94996}
              pcbY={-1.149096}
              width={0.532003}
              height={1.072007}
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={0}
              pcbY={-1.149096}
              width={0.532003}
              height={1.072007}
              shape="rect"
            />
            <smtpad
              portHints={["pin3"]}
              pcbX={0.94996}
              pcbY={-1.149096}
              width={0.532003}
              height={1.072007}
              shape="rect"
            />
            <smtpad
              portHints={["pin4"]}
              pcbX={0.94996}
              pcbY={1.149096}
              width={0.532003}
              height={1.072007}
              shape="rect"
            />
            <smtpad
              portHints={["pin5"]}
              pcbX={0}
              pcbY={1.149096}
              width={0.532003}
              height={1.072007}
              shape="rect"
            />
            <smtpad
              portHints={["pin6"]}
              pcbX={-0.94996}
              pcbY={1.149096}
              width={0.532003}
              height={1.072007}
              shape="rect"
            />
          </footprint>
        }
      />
      <resistor
        name="R_USB"
        resistance="100"
        footprint="0402"
        pcbX={0.95}
        pcbY={5}
        connections={{ pin1: "net.USB_DP" }}
      />
      <resistor
        name="R_MCU"
        resistance="100"
        footprint="0402"
        pcbX={0.95}
        pcbY={-5}
        connections={{ pin1: "net.USB_DP" }}
      />
      <capacitor
        name="C_SUPPLY"
        capacitance="100nF"
        footprint="0402"
        pcbX={5}
        connections={{ pin1: "net.VBUS", pin2: "net.GND" }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPinNumbers: true,
  })
})
