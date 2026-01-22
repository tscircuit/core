import { test, expect } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"

test("all normal components source render with displayName", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={40} height={40}>
      {/* Row 1 */}
      <battery name="B1" displayName="My Battery" schX={0} schY={0} />
      <capacitor
        name="C1"
        displayName="My Capacitor"
        capacitance="10uF"
        schX={5}
        schY={0}
      />
      <chip name="U1" displayName="My Chip" schX={10} schY={0} />
      <crystal
        name="Y1"
        displayName="My Crystal"
        frequency="10MHz"
        loadCapacitance="10pF"
        schX={15}
        schY={0}
      />
      <currentsource
        name="I1"
        displayName="My CurrentSource"
        current="1A"
        schX={20}
        schY={0}
      />

      {/* Row 2 */}
      <diode name="D1" displayName="My Diode" schX={0} schY={5} />
      <fuse
        name="F1"
        displayName="My Fuse"
        currentRating="1A"
        voltageRating="10V"
        schX={5}
        schY={5}
      />
      <inductor
        name="L1"
        displayName="My Inductor"
        inductance="10uH"
        schX={10}
        schY={5}
      />
      <interconnect
        name="J1"
        displayName="My Interconnect"
        schX={15}
        schY={5}
      />
      <jumper name="JP1" displayName="My Jumper" schX={20} schY={5} />

      {/* Row 3 */}
      <led name="LED1" displayName="My Led" schX={0} schY={10} />
      <mosfet
        name="Q1"
        displayName="My Mosfet"
        channelType="n"
        mosfetMode="enhancement"
        schX={5}
        schY={10}
      />
      <opamp name="U2" displayName="My OpAmp" schX={10} schY={10} />
      <pinheader
        name="J2"
        displayName="My PinHeader"
        pinCount={2}
        schX={15}
        schY={10}
      />
      <pinout name="U3" displayName="My Pinout" schX={20} schY={10} />

      {/* Row 4 */}
      <potentiometer
        name="R1"
        displayName="My Potentiometer"
        maxResistance="10k"
        schX={0}
        schY={15}
      />
      <powersource
        name="V1"
        displayName="My PowerSource"
        voltage="5V"
        schX={5}
        schY={15}
      />
      <pushbutton name="SW1" displayName="My PushButton" schX={10} schY={15} />
      <resistor
        name="R2"
        displayName="My Resistor"
        resistance="1k"
        schX={15}
        schY={15}
      />
      <resonator
        name="Y2"
        displayName="My Resonator"
        frequency="10MHz"
        loadCapacitance="10pF"
        schX={20}
        schY={15}
      />

      {/* Row 5 */}
      <solderjumper
        name="SJ1"
        displayName="My SolderJumper"
        schX={0}
        schY={20}
      />
      <switch name="SW2" displayName="My Switch" schX={5} schY={20} />
      <testpoint name="TP1" displayName="My TestPoint" schX={10} schY={20} />
      <transistor
        name="Q2"
        displayName="My Transistor"
        type="npn"
        schX={15}
        schY={20}
      />
      <voltagesource
        name="V2"
        displayName="My VoltageSource"
        voltage="5V"
        schX={20}
        schY={20}
      />
    </board>,
  )

  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
