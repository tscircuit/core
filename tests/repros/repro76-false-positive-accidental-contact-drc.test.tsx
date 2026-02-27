import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("false positive accidental contact DRC (simplified) - fixed", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="28mm" schematicDisabled outlineOffsetX="-7.5mm">
      <group name="greenpill">
        <chip
          name="U1"
          pcbRotation={90}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                pcbX="-2.925064000000134mm"
                pcbY="-2.870961999999963mm"
                width="0.3640074mm"
                height="1.7420082mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin2"]}
                pcbX="-2.2750780000000077mm"
                pcbY="-2.870961999999963mm"
                width="0.3640074mm"
                height="1.7420082mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin3"]}
                pcbX="-1.6250920000001088mm"
                pcbY="-2.870961999999963mm"
                width="0.3640074mm"
                height="1.7420082mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin4"]}
                pcbX="-0.9751059999999825mm"
                pcbY="-2.870961999999963mm"
                width="0.3640074mm"
                height="1.7420082mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin5"]}
                pcbX="-0.32486600000004273mm"
                pcbY="-2.870961999999963mm"
                width="0.3640074mm"
                height="1.7420082mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin6"]}
                pcbX="0.32512000000008356mm"
                pcbY="-2.870961999999963mm"
                width="0.3640074mm"
                height="1.7420082mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin7"]}
                pcbX="0.9751059999999825mm"
                pcbY="-2.870961999999963mm"
                width="0.3640074mm"
                height="1.7420082mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin8"]}
                pcbX="1.625091999999995mm"
                pcbY="-2.870961999999963mm"
                width="0.3640074mm"
                height="1.7420082mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin9"]}
                pcbX="2.2750780000000077mm"
                pcbY="-2.870961999999963mm"
                width="0.3640074mm"
                height="1.7420082mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin10"]}
                pcbX="2.9250640000000203mm"
                pcbY="-2.870961999999963mm"
                width="0.3640074mm"
                height="1.7420082mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin20"]}
                pcbX="-2.925064000000134mm"
                pcbY="2.870961999999963mm"
                width="0.3640074mm"
                height="1.7420082mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin19"]}
                pcbX="-2.2750780000000077mm"
                pcbY="2.870961999999963mm"
                width="0.3640074mm"
                height="1.7420082mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin18"]}
                pcbX="-1.6250920000001088mm"
                pcbY="2.870961999999963mm"
                width="0.3640074mm"
                height="1.7420082mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin17"]}
                pcbX="-0.9751059999999825mm"
                pcbY="2.870961999999963mm"
                width="0.3640074mm"
                height="1.7420082mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin16"]}
                pcbX="-0.32486600000004273mm"
                pcbY="2.870961999999963mm"
                width="0.3640074mm"
                height="1.7420082mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin15"]}
                pcbX="0.32512000000008356mm"
                pcbY="2.870961999999963mm"
                width="0.3640074mm"
                height="1.7420082mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin14"]}
                pcbX="0.9751059999999825mm"
                pcbY="2.870961999999963mm"
                width="0.3640074mm"
                height="1.7420082mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin13"]}
                pcbX="1.625091999999995mm"
                pcbY="2.870961999999963mm"
                width="0.3640074mm"
                height="1.7420082mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin12"]}
                pcbX="2.2750780000000077mm"
                pcbY="2.870961999999963mm"
                width="0.3640074mm"
                height="1.7420082mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin11"]}
                pcbX="2.9250640000000203mm"
                pcbY="2.870961999999963mm"
                width="0.3640074mm"
                height="1.7420082mm"
                shape="rect"
              />
            </footprint>
          }
          pinLabels={{
            pin1: ["pin1"],
            pin2: ["pin2"],
            pin3: ["pin3"],
            pin4: ["pin4"],
            pin5: ["pin5"],
            pin6: ["pin6"],
            pin7: ["VSS"],
            pin8: ["pin8"],
            pin9: ["VDD"],
            pin10: ["pin10"],
            pin11: ["pin11"],
            pin12: ["pin12"],
            pin13: ["pin13"],
            pin14: ["pin14"],
            pin15: ["pin15"],
            pin16: ["pin16"],
            pin17: ["pin17"],
            pin18: ["pin18"],
            pin19: ["pin19"],
            pin20: ["pin20"],
          }}
          connections={{
            VDD: ["net.VDD"],
            VSS: ["net.GND"],
            pin2: ["net.BOARD_TX", "net.PD5"],
            pin3: ["net.BOARD_RX", "net.PD6"],
            pin4: ["net.RST", "net.PD7"],
            pin18: ["net.SWIO", "net.PD1"],
            pin1: ["net.PD4"],
            pin5: ["net.PA1"],
            pin6: ["net.PA2"],
            pin7: ["net.GND"],
            pin8: ["net.PD0"],
            pin9: ["net.VDD"],
            pin10: ["net.PC0"],
            pin11: ["net.PC1"],
            pin12: ["net.PC2"],
            pin13: ["net.PC3"],
            pin14: ["net.PC4"],
            pin15: ["net.PC5"],
            pin16: ["net.PC6"],
            pin17: ["net.PC7"],
            pin19: ["net.PD2"],
            pin20: ["net.PD3"],
          }}
        />
        <jumper
          name="J1_greenpill"
          footprint="pinrow3"
          connections={{ pin1: "net.SWIO", pin2: "net.GND", pin3: "net.VDD" }}
          pcbX={3}
          pcbY={6}
          doNotPlace
        />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const accidentalContactErrors = circuitJson.filter(
    (el) =>
      el.type === "pcb_trace_error" &&
      (el as any).message?.includes("accidental contact"),
  )

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
  expect(accidentalContactErrors.length).toBe(0)
})
