import { expect, test } from "bun:test"
import { checkViaPadClearance } from "@tscircuit/checks"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unconnected bottom-layer exposed pads still own their footprint vias", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={20} isViaInPadAllowed>
      <chip
        name="U1"
        layer="bottom"
        pcbRotation={90}
        pinLabels={{ pin57: ["GND", "thermalpad"] }}
        footprint="qfn56_thermalpad4mmx4mm_thermalvias3x3_thermalviapitch0.9999mm_thermalviaid0.3048mm_thermalviaod0.6096mm_p0.4mm_h7.68mm_pw0.2mm_pl0.66mm"
      />
      <pcbnotetext
        pcbY={-7}
        fontSize={0.5}
        text="Bottom-side thermal vias belong to U1.GND without traces"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const connectivityMap = getFullConnectivityMapFromCircuitJson(circuitJson)
  const thermalPad = circuit.db.pcb_smtpad
    .list()
    .find((pad) => pad.port_hints?.includes("thermalpad"))!
  expect(thermalPad.layer).toBe("bottom")
  expect(circuit.db.pcb_via.list()).toHaveLength(9)
  for (const via of circuit.db.pcb_via.list()) {
    expect(via.source_trace_id).toBeUndefined()
    expect(via.pcb_port_ids).toEqual([thermalPad.pcb_port_id!])
    expect(
      connectivityMap.areIdsConnected(via.pcb_via_id, thermalPad.pcb_smtpad_id),
    ).toBe(true)
  }
  expect(checkViaPadClearance(circuitJson)).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
