import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { sel } from "lib/sel"

test("Jumper, solderjumper, resistance routing and connections repro", async () => {
  const { circuit } = getTestFixture()
  const jumperPinLabels = {
    pin1: "GND",
    pin2: "VCC",
    pin3: "SDA",
    pin4: "SCL",
  }

  circuit.add(
    <board>
      <schematictext
        text="Power-On Reset"
        schX={-1}
        schY={2}
        color="brown"
        anchor="center"
        fontSize={0.3}
      />
      <resistor
        resistance="10k"
        footprint="0603"
        name="R7"
        pcbX={-5.461}
        pcbY={3.81}
        schX={-0.8}
        schY={-1}
        schRotation={90}
        connections={{
          pin2: sel.Q1.gate,
        }}
      />
      <netlabel
        net="GND"
        schX={-0.8}
        schY={-1.8}
        connection="R7.pin1"
        anchorSide="top"
      />

      <mosfet
        name="Q1"
        footprint={
          <footprint name="q1_footprint">
            <smtpad
              portHints={["pin1"]}
              pcbX="-0.95mm"
              pcbY="-1mm"
              width="0.8mm"
              height="0.9mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX="0.95mm"
              pcbY="-1mm"
              width="0.8mm"
              height="0.9mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin3"]}
              pcbX="0mm"
              pcbY="1.1mm"
              width="0.8mm"
              height="0.9mm"
              shape="rect"
            />
          </footprint>
        }
        channelType="p"
        mosfetMode="enhancement"
        pcbRotation={270}
        pcbX={-5.08}
        pcbY={1.27}
      />
      <netlabel
        net="V3_3"
        schX={0.305}
        schY={1}
        connection="Q1.pin1"
        anchorSide="bottom"
      />
      <netlabel
        net="V3_3_SW"
        schX={0.9}
        schY={-0.5}
        connection="Q1.pin2"
        anchorSide="bottom"
      />
      <netlabel
        net="DISABLE"
        schX={-1.3}
        schY={-0.1}
        connection="Q1.pin3"
        anchorSide="right"
      />

      <schematictext
        text="Hall-Effect Sensor - TMAG5273"
        schX={4.5}
        schY={2}
        color="brown"
        anchor="center"
        fontSize={0.3}
      />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0603"
        pcbX={-2.5}
        pcbY={-1.2}
        schX={7}
        schRotation="-90deg"
      />

      <netlabel
        net="V3_3_SW"
        schX={7}
        schY={1}
        connection="C1.pin1"
        anchorSide="bottom"
      />

      <netlabel
        net="GND"
        schX={7}
        schY={-1}
        connection="C1.pin2"
        anchorSide="top"
      />

      <schematictext
        text="I2C Pullup"
        schX={10}
        schY={2}
        color="brown"
        anchor="center"
        fontSize={0.3}
      />
      <solderjumper
        name="I2C"
        footprint="solderjumper3_bridged123_p1.0414_pw0.6604_ph1.27"
        bridgedPins={[
          ["1", "2"],
          ["2", "3"],
        ]}
        pcbX={1.905}
        pcbY={-4.54}
        schX={10}
        pinCount={3}
        schRotation="180deg"
        connections={{
          pin1: sel.R5.pin2,
          pin2: sel.net().V3_3_SW,
          pin3: sel.R2.pin2,
        }}
      />

      <resistor
        resistance="2.2k"
        footprint="0603"
        name="R2"
        pcbX={1.27}
        pcbY={4.5}
        schX={9}
        schY={-1}
        schRotation={90}
        connections={{
          pin1: sel.net.SDA,
        }}
      />

      <netlabel
        net="SDA"
        schX={9.4}
        schY={-2}
        connection="R2.pin1"
        anchorSide="left"
      />

      <resistor
        resistance="2.2k"
        footprint="0603"
        name="R5"
        pcbX={0}
        pcbY={2.032}
        schX={11}
        schY={-1}
        pcbRotation={180}
        schRotation={90}
        connections={{
          pin1: sel.net.SCL,
        }}
      />
      <netlabel
        net="SCL"
        schX={11.4}
        schY={-2}
        connection="R5.pin1"
        anchorSide="left"
      />

      <schematictext
        text="Qwiic Connectors"
        schX={5}
        schY={-4}
        color="brown"
        anchor="center"
        fontSize={0.3}
      />
      <jumper
        name="J1"
        footprint={
          <footprint name="jstsh4_vert_1mm">
            <smtpad
              portHints={["pin1"]}
              pcbX="-1.5mm"
              pcbY="0.775mm"
              width="0.6mm"
              height="1.55mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX="-0.5mm"
              pcbY="0.775mm"
              width="0.6mm"
              height="1.55mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin3"]}
              pcbX="0.5mm"
              pcbY="0.775mm"
              width="0.6mm"
              height="1.55mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin4"]}
              pcbX="1.5mm"
              pcbY="0.775mm"
              width="0.6mm"
              height="1.55mm"
              shape="rect"
            />
            <smtpad
              portHints={["NC2"]}
              pcbX="-2.8mm"
              pcbY="3.2mm"
              width="1.2mm"
              height="2mm"
              shape="rect"
            />
            <smtpad
              portHints={["NC1"]}
              pcbX="2.8mm"
              pcbY="3.2mm"
              width="1.2mm"
              height="2mm"
              shape="rect"
            />
          </footprint>
        }
        pcbX={-8.001}
        pcbY={2.54}
        schX={3}
        schY={-6}
        pcbRotation={90}
        pinLabels={jumperPinLabels}
        connections={{
          GND: sel.net.GND,
          VCC: sel.net.V3_3,
          SDA: sel.net.SDA,
          SCL: sel.net.SCL,
        }}
      />

      <netlabel
        net="GND"
        schX={4.8}
        schY={-6.5}
        connection="J1.pin1"
        anchorSide="top"
      />
      <netlabel
        net="V3_3"
        schX={4.8}
        schY={-5}
        connection="J1.pin2"
        anchorSide="bottom"
      />
      <netlabel
        net="SDA"
        schX={5.2}
        schY={-5.9}
        connection="J1.pin3"
        anchorSide="left"
      />
      <netlabel
        net="SCL"
        schX={5.2}
        schY={-5.7}
        connection="J1.pin4"
        anchorSide="left"
      />

      <schematictext
        text="Power LED"
        schX={12}
        schY={-4}
        color="brown"
        anchor="center"
        fontSize={0.3}
      />
      <resistor
        resistance="4.7k"
        footprint="0603"
        name="R3"
        pcbRotation={270}
        pcbX={6.096}
        pcbY={2.54}
        schX={12}
        schY={-6}
        schRotation={90}
        connections={{
          pin1: sel.D1.anode,
        }}
      />
      <netlabel
        net="V3_3_SW"
        schX={12}
        schY={-5}
        connection="R3.pin2"
        anchorSide="bottom"
      />
      <led
        name="D1"
        footprint="0603"
        color="red"
        pcbRotation={270}
        pcbX={4}
        pcbY={2.54}
        schX={12}
        schY={-8}
        schRotation={-90}
        connections={{
          anode: sel.R3.pin1,
        }}
      />
      <solderjumper
        name="LED"
        footprint="solderjumper2_bridged12_p1.0414_pw0.6604_ph1.27"
        bridgedPins={[["1", "2"]]}
        pcbX={3.921}
        pcbY={-1.3}
        schX={12}
        schY={-9.5}
        pinCount={2}
        schRotation={-90}
        connections={{
          pin1: sel.D1.cathode,
          pin2: sel.net.GND,
        }}
      />
      <netlabel
        net="GND"
        schX={12}
        schY={-10.5}
        connection="LED.pin2"
        anchorSide="top"
      />
      <schematictext
        text="INT Pullup"
        schX={15}
        schY={-4}
        color="brown"
        anchor="center"
        fontSize={0.3}
      />
      <solderjumper
        name="INT_JP"
        footprint="solderjumper2_bridged12_p1.0414_pw0.6604_ph1.27"
        bridgedPins={[["1", "2"]]}
        pcbX={-6.35}
        pcbY={-4.794}
        schX={14.7}
        schY={-6}
        pinCount={2}
        schRotation={-90}
        connections={{
          pin1: sel.net().V3_3_SW,
          pin2: sel.R4.pin2,
        }}
      />
      <netlabel
        net="V3_3_SW"
        schX={14.7}
        schY={-5}
        connection="INT_JP.pin1"
        anchorSide="bottom"
      />
      <resistor
        resistance="10k"
        footprint="0603"
        name="R4"
        pcbX={-1.651}
        pcbY={-3.778}
        schX={14.7}
        schY={-8}
        schRotation={90}
        connections={{
          pin1: sel.net.N_INT,
        }}
      />
      <netlabel
        net="INT"
        schX={15}
        schY={-9.5}
        connection="R4.pin1"
        anchorSide="left"
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
