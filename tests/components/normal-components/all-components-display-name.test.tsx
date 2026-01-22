import { test, expect } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"

test("all normal components source render with DisplayName", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={50} height={30}>
      {/* Row 1 - Y=0 */}
      <battery name="B1" displayName="BatteryDisplayName" schX={0} schY={0} />
      <capacitor
        name="C1"
        displayName="CapacitorDisplayName"
        capacitance="10uF"
        schX={6}
        schY={0}
      />
      <crystal
        name="Y1"
        displayName="CrystalDisplayName"
        frequency="10MHz"
        loadCapacitance="10pF"
        schX={12}
        schY={0}
      />
      <currentsource
        name="I1"
        displayName="CurrentSourceDisplayName"
        current="1A"
        schX={18}
        schY={0}
      />
      <diode name="D1" displayName="Diode" schX={24} schY={0} />

      {/* Row 2 - Y=6 */}
      <fuse
        name="F1"
        displayName="FuseDisplayName"
        currentRating="1A"
        voltageRating="10V"
        schX={0}
        schY={6}
      />
      <inductor
        name="L1"
        displayName="InductorDisplayName"
        inductance="10uH"
        schX={6}
        schY={6}
      />
      <led name="LED1" displayName="LedDisplayName" schX={12} schY={6} />
      <mosfet
        name="Q1"
        displayName="MosfetDisplayName"
        channelType="n"
        mosfetMode="enhancement"
        schX={18}
        schY={6}
      />
      <potentiometer
        name="R1"
        displayName="PotentiometerDisplayName"
        maxResistance="10k"
        schX={24}
        schY={6}
      />

      {/* Row 3 - Y=12 */}
      <pushbutton
        name="SW1"
        displayName="PushButtonDisplayName"
        schX={0}
        schY={12}
      />
      <resistor
        name="R2"
        displayName="ResistorDisplayName"
        resistance="1k"
        schX={6}
        schY={12}
      />
      <resonator
        name="Y2"
        displayName="ResonatorDisplayName"
        frequency="10MHz"
        loadCapacitance="10pF"
        schX={12}
        schY={12}
      />
      <solderjumper
        name="SJ1"
        displayName="SolderJumperDisplayName"
        schX={18}
        schY={12}
      />
      <switch name="SW2" displayName="SwitchDisplayName" schX={24} schY={12} />

      {/* Row 4 - Y=18 */}
      <testpoint
        name="TP1"
        displayName="TestPointDisplayName"
        schX={0}
        schY={18}
      />
      <transistor
        name="Q2"
        displayName="TransistorDisplayName"
        type="npn"
        schX={6}
        schY={18}
      />
      <voltagesource
        name="V2"
        displayName="VoltageSourceDisplayName"
        voltage="5V"
        schX={12}
        schY={18}
      />
    </board>,
  )

  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
