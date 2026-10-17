import { expect, test } from "bun:test"
import { checkViaPadClearance } from "@tscircuit/checks"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("footprinter thermal vias inherit their exposed pad net without assigning foreign vias", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={20} isViaInPadAllowed>
      <chip
        name="U1"
        pinLabels={{ pin57: ["GND", "thermalpad"] }}
        connections={{ GND: "net.GND" }}
        footprint="qfn56_thermalpad4mmx4mm_thermalvias3x3_thermalviapitch0.9999mm_thermalviaid0.3048mm_thermalviaod0.6096mm_p0.4mm_h7.68mm_pw0.2mm_pl0.66mm"
      />
      <via
        name="V_FOREIGN"
        pcbX={0.5}
        pcbY={0.5}
        holeDiameter={0.3}
        outerDiameter={0.6}
        connectsTo="net.VCC"
      />
      <pcbnotetext
        pcbY={-7}
        fontSize={0.5}
        text="9 thermal vias are GND; V_FOREIGN remains VCC"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const connectivityMap = getFullConnectivityMapFromCircuitJson(circuitJson)
  const gnd = circuit.db.source_net.getWhere({ name: "GND" })!
  const vcc = circuit.db.source_net.getWhere({ name: "VCC" })!
  const thermalPad = circuit.db.pcb_smtpad
    .list()
    .find((pad) => pad.port_hints?.includes("thermalpad"))!
  const thermalVias = circuit.db.pcb_via
    .list()
    .filter((via) => via.source_net_id !== vcc.source_net_id)
  expect(thermalVias).toHaveLength(9)
  for (const via of thermalVias) {
    expect(
      connectivityMap.areIdsConnected(via.pcb_via_id, gnd.source_net_id),
    ).toBe(true)
    expect(via.subcircuit_connectivity_map_key).toBe(
      gnd.subcircuit_connectivity_map_key,
    )
    expect(via.pcb_port_ids).toEqual([thermalPad.pcb_port_id!])
  }

  const foreignVia = circuit.db.pcb_via
    .list()
    .find((via) => via.source_net_id === vcc.source_net_id)!
  expect(
    connectivityMap.areIdsConnected(foreignVia.pcb_via_id, gnd.source_net_id),
  ).toBe(false)
  const clearanceErrors = checkViaPadClearance(circuitJson)
  expect(clearanceErrors).toHaveLength(1)
  expect(clearanceErrors[0].pcb_pad_ids).toEqual([
    foreignVia.pcb_via_id,
    thermalPad.pcb_smtpad_id,
  ])

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
