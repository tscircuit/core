import { expect } from "bun:test"
import { test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro84 schematic pin out", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board schAutoLayoutEnabled>
      <group name="components">
        <chip
          name="MCU"
          footprint="soic8"
          pinLabels={{
            pin1: "D2",
            pin2: "D3",
            pin3: "D4",
            pin4: "D6",
            pin5: "D9",
            pin6: "D10",
            pin7: "D11",
            pin8: "A0",
          }}
        />
        <jumper
          name="Servo_servo_1"
          manufacturerPartNumber="Servo"
          displayName="Servo"
          footprint="pinrow3"
          pinLabels={{ pin1: "SIG", pin2: "VCC", pin3: "GND" }}
        />
        <pushbutton
          name="Button_e5g52nj8aud"
          manufacturerPartNumber="Button"
          displayName="Button"
          footprint="pushbutton"
          pinLabels={{ pin1: "SIG", pin2: "GND" }}
        />
        <jumper
          name="Hall_Effect_ica2duxymd"
          manufacturerPartNumber="Hall Effect"
          displayName="Hall Effect"
          footprint="pinrow3"
          pinLabels={{ pin1: "SIG", pin2: "VCC", pin3: "GND" }}
        />
        <resonator
          name="Piezo_x1cxxx7zkpg"
          manufacturerPartNumber="Piezo"
          displayName="Piezo"
          loadCapacitance="." // hack to remove it from the schematic
          frequency="440Hz"
        />
        <jumper
          name="LED_Matrix_d1om9d3kn8t"
          manufacturerPartNumber="LED Matrix"
          displayName="LED Matrix"
          footprint="pinrow5"
          pinLabels={{
            pin1: "DIN",
            pin2: "CLK",
            pin3: "CS",
            pin4: "VCC",
            pin5: "GND",
          }}
        />
        <switch
          name="Relay_9jy02520qa"
          manufacturerPartNumber="Relay"
          displayName="Relay"
          type="spdt"
          isNormallyClosed={false}
        />
        <jumper
          name="Force_ltky7q4a76"
          manufacturerPartNumber="Force"
          displayName="Force"
          footprint="pinrow3"
          pinLabels={{ pin1: "SIG", pin2: "VCC", pin3: "GND" }}
        />
      </group>
      <trace
        // layer="signal"
        thickness="0.5mm"
        from=".Servo_servo_1 > .pin1"
        to=".MCU > .pin5"
      />
      <trace
        // layer="signal"
        thickness="0.5mm"
        from=".Button_e5g52nj8aud > .pin1"
        to=".MCU > .pin4"
      />
      <trace
        // layer="signal"
        thickness="0.5mm"
        from=".Hall_Effect_ica2duxymd > .pin1"
        to=".MCU > .pin8"
      />
      <trace
        // layer="signal"
        thickness="0.5mm"
        from=".Piezo_x1cxxx7zkpg > .pin1"
        to=".MCU > .pin7"
      />
      <trace
        // layer="signal"
        thickness="0.5mm"
        from=".LED_Matrix_d1om9d3kn8t > .pin1"
        to=".MCU > .pin1"
      />
      <trace
        // layer="signal"
        thickness="0.5mm"
        from=".LED_Matrix_d1om9d3kn8t > .pin2"
        to=".MCU > .pin2"
      />
      <trace
        // layer="signal"
        thickness="0.5mm"
        from=".LED_Matrix_d1om9d3kn8t > .pin3"
        to=".MCU > .pin3"
      />
      <trace
        // layer="signal"
        thickness="0.5mm"
        from=".Relay_9jy02520qa > .pin1"
        to=".MCU > .pin6"
      />
      <trace
        // layer="signal"
        thickness="0.5mm"
        from=".Force_ltky7q4a76 > .pin1"
        to=".MCU > .pin8"
      />
      <trace
        // layer="power"
        thickness="0.5mm"
        from=".Servo_servo_1 > .pin2"
        to="net.VCC"
      />
      <trace
        // layer="power"
        thickness="0.5mm"
        from=".Hall_Effect_ica2duxymd > .pin2"
        to="net.VCC"
      />
      <trace
        // layer="power"
        thickness="0.5mm"
        from=".LED_Matrix_d1om9d3kn8t > .pin4"
        to="net.VCC"
      />
      <trace thickness="0.5mm" from=".Relay_9jy02520qa > .pin2" to="net.VCC" />
      <trace thickness="0.5mm" from=".Force_ltky7q4a76 > .pin2" to="net.VCC" />
      <trace thickness="0.5mm" from=".Servo_servo_1 > .pin3" to="net.GND" />
      <trace
        thickness="0.5mm"
        from=".Button_e5g52nj8aud > .pin2"
        to="net.GND"
      />
      <trace
        thickness="0.5mm"
        from=".Hall_Effect_ica2duxymd > .pin3"
        to="net.GND"
      />
      <trace thickness="0.5mm" from=".Piezo_x1cxxx7zkpg > .pin2" to="net.GND" />
      <trace
        thickness="0.5mm"
        from=".LED_Matrix_d1om9d3kn8t > .pin5"
        to="net.GND"
      />
      <trace thickness="0.5mm" from=".Relay_9jy02520qa > .pin3" to="net.GND" />
      <trace thickness="0.5mm" from=".Force_ltky7q4a76 > .pin3" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
