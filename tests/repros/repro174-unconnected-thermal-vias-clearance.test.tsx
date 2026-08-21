import { expect, test } from "bun:test"
import { checkViaPadClearance } from "@tscircuit/checks"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro174: unconnected exposed pads report their thermal vias as clearance errors", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <chip
        name="U1"
        pinLabels={{
          pin1: ["VIN"],
          pin2: ["VOUT"],
          pin21: ["THERMAL_PAD"],
        }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX="-2.5mm"
              pcbY="0mm"
              width="1mm"
              height="0.6mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX="2.5mm"
              pcbY="0mm"
              width="1mm"
              height="0.6mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin21"]}
              pcbX="0mm"
              pcbY="0mm"
              width="3mm"
              height="2mm"
              shape="rect"
            />
            <via
              pcbX="-0.75mm"
              pcbY="-0.5mm"
              outerDiameter="0.4mm"
              holeDiameter="0.2mm"
            />
            <via
              pcbX="0.75mm"
              pcbY="-0.5mm"
              outerDiameter="0.4mm"
              holeDiameter="0.2mm"
            />
            <via
              pcbX="-0.75mm"
              pcbY="0.5mm"
              outerDiameter="0.4mm"
              holeDiameter="0.2mm"
            />
            <via
              pcbX="0.75mm"
              pcbY="0.5mm"
              outerDiameter="0.4mm"
              holeDiameter="0.2mm"
            />
          </footprint>
        }
      />
      <capacitor name="C_IN" capacitance="10uF" footprint="0805" pcbX="-7mm" />
      <capacitor name="C_OUT" capacitance="10uF" footprint="0805" pcbX="7mm" />
      <pcbnotetext
        pcbY="-4mm"
        fontSize="0.4mm"
        text="BUG: THERMAL VIAS ARE TREATED AS UNCONNECTED"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const exposedPad = circuit.db.pcb_smtpad
    .list()
    .find((pad) => pad.port_hints?.includes("pin21"))!
  const thermalVias = circuit.db.pcb_via.list()
  const connectivityMap = getFullConnectivityMapFromCircuitJson(circuitJson)
  const clearanceErrors = checkViaPadClearance(circuitJson)

  expect(thermalVias).toHaveLength(4)
  expect(
    connectivityMap.getNetConnectedToId(exposedPad.pcb_smtpad_id),
  ).toBeDefined()
  for (const thermalVia of thermalVias) {
    expect(connectivityMap.getNetConnectedToId(thermalVia.pcb_via_id)).not.toBe(
      connectivityMap.getNetConnectedToId(exposedPad.pcb_smtpad_id),
    )
  }
  expect(clearanceErrors).toHaveLength(4)
  expect(
    clearanceErrors.every((error) =>
      error.pcb_pad_ids.includes(exposedPad.pcb_smtpad_id),
    ),
  ).toBe(true)

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
    showErrorsInTextOverlay: true,
  })
})
