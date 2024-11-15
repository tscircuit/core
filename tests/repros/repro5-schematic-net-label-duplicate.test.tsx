import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro5 duplicate net labels on schematic doesn't throws error", async () => {
  const { circuit } = getTestFixture()

  const pinLabels = {
    pin1: ["pin1", "AO11"],
    pin2: ["pin2", "AO12"],
    pin3: ["pin3", "PGND11"],
    pin4: ["pin4", "PGND12"],
    pin5: ["pin5", "AO21"],
    pin6: ["pin6", "AO22"],
    pin7: ["pin7", "BO21"],
    pin8: ["pin8", "BO22"],
    pin9: ["pin9", "PGND21"],
    pin10: ["pin10", "PGND22"],
    pin11: ["pin11", "BO11"],
    pin12: ["pin12", "BO12"],
    pin13: ["pin13", "VM2"],
    pin14: ["pin14", "VM3"],
    pin15: ["pin15", "PWMB"],
    pin16: ["pin16", "BIN2"],
    pin17: ["pin17", "BIN1"],
    pin18: ["pin18", "GND"],
    pin19: ["pin19", "STBY"],
    pin20: ["pin20", "VCC"],
    pin21: ["pin21", "AIN1"],
    pin22: ["pin22", "AIN2"],
    pin23: ["pin23", "PWMA"],
    pin24: ["pin24", "VM1"],
  } as const

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="C1"
        pinLabels={pinLabels}
        supplierPartNumbers={{
          lcsc: ["C141517"],
        }}
        pcbRotation={90}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX="-3.575050000000033mm"
              pcbY="-3.562095999999883mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX="-2.925064000000134mm"
              pcbY="-3.562095999999883mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin3"]}
              pcbX="-2.2750780000000077mm"
              pcbY="-3.562095999999883mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin4"]}
              pcbX="-1.6250920000001088mm"
              pcbY="-3.562095999999883mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin5"]}
              pcbX="-0.9751059999999825mm"
              pcbY="-3.562095999999883mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin6"]}
              pcbX="-0.32486600000004273mm"
              pcbY="-3.562095999999883mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin7"]}
              pcbX="0.32512000000008356mm"
              pcbY="-3.562095999999883mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin8"]}
              pcbX="0.9751059999999825mm"
              pcbY="-3.562095999999883mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin9"]}
              pcbX="1.625091999999995mm"
              pcbY="-3.562095999999883mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin10"]}
              pcbX="2.2750780000000077mm"
              pcbY="-3.562095999999883mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin11"]}
              pcbX="2.9250640000000203mm"
              pcbY="-3.562095999999883mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin12"]}
              pcbX="3.5750499999999192mm"
              pcbY="-3.562095999999883mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin24"]}
              pcbX="-3.575050000000033mm"
              pcbY="3.562095999999997mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin23"]}
              pcbX="-2.925064000000134mm"
              pcbY="3.562095999999997mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin22"]}
              pcbX="-2.2750780000000077mm"
              pcbY="3.562095999999997mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin21"]}
              pcbX="-1.6250920000001088mm"
              pcbY="3.562095999999997mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin20"]}
              pcbX="-0.9751059999999825mm"
              pcbY="3.562095999999997mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin19"]}
              pcbX="-0.32486600000004273mm"
              pcbY="3.562095999999997mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin18"]}
              pcbX="0.32512000000008356mm"
              pcbY="3.562095999999997mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin17"]}
              pcbX="0.9751059999999825mm"
              pcbY="3.562095999999997mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin16"]}
              pcbX="1.625091999999995mm"
              pcbY="3.562095999999997mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin15"]}
              pcbX="2.2750780000000077mm"
              pcbY="3.562095999999997mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin14"]}
              pcbX="2.9250640000000203mm"
              pcbY="3.562095999999997mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin13"]}
              pcbX="3.5750499999999192mm"
              pcbY="3.562095999999997mm"
              width="0.30800039999999995mm"
              height="1.3240004mm"
              shape="rect"
            />
            <silkscreenpath
              route={[
                { x: -4.064000000000078, y: 2.6669999999999163 },
                { x: -4.064000000000078, y: -2.66700000000003 },
                { x: 3.936999999999898, y: -2.66700000000003 },
                { x: 3.936999999999898, y: 2.6669999999999163 },
                { x: -4.064000000000078, y: 2.6669999999999163 },
              ]}
            />
          </footprint>
        }
      />
      <capacitor name="C2" capacitance="100nF" schX={2} schY={0} />

      <trace from=".C1 > .pin1" to="net.GND" />
      <trace from=".C2 > .pin2" to="net.GND" />
    </board>,
  )

  circuit.render()

  const netLabels = circuit.db.schematic_net_label.list()
  expect(netLabels.length).toBe(2)
  expect(netLabels[0].text).toBe("GND")
  expect(netLabels[1].text).toBe("GND")

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
