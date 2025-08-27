import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { sel } from "lib/sel"

// Snapshot test for jumper netlabel connections

test("Jumper and netlabel connections repro", async () => {
  const { circuit } = getTestFixture()
  circuit._featureMspSchematicTraceRouting = true
  const jumperPinLabels = {
    pin1: "GND",
    pin2: "VCC",
    pin3: "SDA",
    pin4: "SCL",
  }

  circuit.add(
    <board width="10mm" height="10mm">
      <jumper
        name="J2"
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
        pcbX={0.001}
        pcbY={0.54}
        schX={7}
        schY={-6}
        pcbRotation={270}
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
        schX={8.8}
        schY={-6.5}
        connection="J2.pin1"
        anchorSide="top"
      />
      <netlabel
        net="V3_3"
        schX={8.8}
        schY={-5}
        connection="J2.pin2"
        anchorSide="bottom"
      />
      <netlabel
        net="SDA"
        schX={9.2}
        schY={-5.9}
        connection="J2.pin3"
        anchorSide="left"
      />
      <netlabel
        net="SCL"
        schX={9.2}
        schY={-5.7}
        connection="J2.pin4"
        anchorSide="left"
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
