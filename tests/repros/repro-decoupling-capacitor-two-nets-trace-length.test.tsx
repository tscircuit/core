import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("net-connected decoupling capacitor enforces its maximum trace length", async () => {
  const { circuit } = getTestFixture()
  let autoroutingStartCount = 0

  circuit.on("autorouting:start", () => {
    autoroutingStartCount++
  })

  circuit.add(
    <board
      width="18mm"
      height="10mm"
      autorouter={{ local: true, groupMode: "subcircuit" }}
    >
      <pcbnotetext
        pcbY={-4}
        fontSize={0.6}
        text="DECOUPLING CAPACITOR CONNECTED THROUGH VCC/GND NETS"
      />
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "VCC", pin4: "GND" }}
        connections={{ VCC: "net.VCC", GND: "net.GND" }}
        pcbX={4}
      />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        decouplingFor="net.VCC"
        decouplingTo="net.GND"
        maxDecouplingTraceLength={2}
        pcbX={-4}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const capacitorSourceTraces = circuit.db.source_trace
    .list()
    .filter((sourceTrace) => sourceTrace.display_name?.includes(".C1"))
  expect(capacitorSourceTraces).toHaveLength(2)
  expect(
    capacitorSourceTraces.map((sourceTrace) => ({
      connectedSourcePortCount: sourceTrace.connected_source_port_ids.length,
      connectedSourceNetCount: sourceTrace.connected_source_net_ids.length,
      maxLength: sourceTrace.max_length,
    })),
  ).toEqual([
    {
      connectedSourcePortCount: 1,
      connectedSourceNetCount: 1,
      maxLength: 2,
    },
    {
      connectedSourcePortCount: 1,
      connectedSourceNetCount: 1,
      maxLength: 2,
    },
  ])

  const autoroutingErrors = circuit.db.pcb_autorouting_error.list()
  expect(autoroutingStartCount).toBe(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace_too_long_warning.list()).toHaveLength(0)
  expect(autoroutingErrors).toHaveLength(1)
  expect(autoroutingErrors[0].message).toContain("2mm maximum length")
  expect(autoroutingErrors[0].message).toContain("endpoints are")

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
})
