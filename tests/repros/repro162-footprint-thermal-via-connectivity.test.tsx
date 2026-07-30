import { expect, test } from "bun:test"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro162: thermal vias inside an exposed pad inherit its connectivity", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="8mm" height="8mm">
      <net name="GND" />
      <chip
        name="U1"
        pinLabels={{ pin17: ["GND"] }}
        connections={{ pin17: "net.GND" }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin17"]}
              pcbX="0mm"
              pcbY="0mm"
              width="2.7399996mm"
              height="2.7399996mm"
              shape="rect"
            />
            <via
              pcbX="0.500126mm"
              pcbY="0.499872mm"
              outerDiameter="0.6096mm"
              holeDiameter="0.3048mm"
              layers={["top", "bottom"]}
            />
            <via
              pcbX="-0.499872mm"
              pcbY="0.499872mm"
              outerDiameter="0.6096mm"
              holeDiameter="0.3048mm"
              layers={["top", "bottom"]}
            />
            <via
              pcbX="-0.499872mm"
              pcbY="-0.500126mm"
              outerDiameter="0.6096mm"
              holeDiameter="0.3048mm"
              layers={["top", "bottom"]}
            />
            <via
              pcbX="0.500126mm"
              pcbY="-0.500126mm"
              outerDiameter="0.6096mm"
              holeDiameter="0.3048mm"
              layers={["top", "bottom"]}
            />
          </footprint>
        }
      />
      <pcbnotetext
        pcbY="-3mm"
        fontSize="0.45mm"
        text="THERMAL VIAS INHERIT GND CONNECTIVITY"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const exposedPad = circuit.db.pcb_smtpad.list()[0]
  const gndNet = circuit.db.source_net.list().find((net) => net.name === "GND")
  const thermalVias = circuit.db.pcb_via.list()
  const connectivityMap = getFullConnectivityMapFromCircuitJson(
    circuit.getCircuitJson(),
  )

  expect(connectivityMap.getNetConnectedToId(exposedPad.pcb_smtpad_id)).toBe(
    connectivityMap.getNetConnectedToId(gndNet!.source_net_id),
  )
  expect(
    connectivityMap.getNetConnectedToId(exposedPad.pcb_smtpad_id),
  ).toBeDefined()
  expect(thermalVias).toHaveLength(4)
  for (const thermalVia of thermalVias) {
    expect(thermalVia.subcircuit_connectivity_map_key).toBe(
      gndNet?.subcircuit_connectivity_map_key,
    )
    expect(thermalVia.subcircuit_connectivity_map_key).toBeDefined()
    expect(thermalVia.pcb_trace_id).toBeDefined()
    expect(connectivityMap.getNetConnectedToId(thermalVia.pcb_via_id)).toBe(
      connectivityMap.getNetConnectedToId(exposedPad.pcb_smtpad_id),
    )
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
