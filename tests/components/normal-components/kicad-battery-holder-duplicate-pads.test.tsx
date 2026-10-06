import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("KiCad battery holder multi-pad positive terminal creates routable pcb_port (tscircuit/tscircuit#4444)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="40mm">
      <chip
        name="BT1"
        pinLabels={{ pin1: "POS", pin2: "NEG" }}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="2mm"
              height="2mm"
              pcbX={-10}
              pcbY={0}
              portHints={["pin1", "POS", "1"]}
            />
            <smtpad
              shape="rect"
              width="2mm"
              height="2mm"
              pcbX={10}
              pcbY={0}
              portHints={["pin1", "POS", "1"]}
            />
            <smtpad
              shape="rect"
              width="4mm"
              height="4mm"
              pcbX={0}
              pcbY={0}
              portHints={["pin2", "NEG", "2"]}
            />
          </footprint>
        }
      />
      <resistor name="R1" resistance="1k" pcbX={-10} pcbY={10} />
      <trace from=".BT1 > .POS" to=".R1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbPorts = circuit.db.pcb_port.list()
  const posPort = pcbPorts.find((p) => {
    const sourcePort = circuit.db.source_port.get(p.source_port_id as string)
    return (
      sourcePort?.name === "POS" ||
      sourcePort?.port_hints?.includes("POS") ||
      sourcePort?.pin_number === 1
    )
  })

  expect(posPort).toBeDefined()
  expect(posPort?.x).toBe(-10)
  expect(posPort?.y).toBe(0)

  // Verify that POS is not among missing-trace warnings
  const missingWarnings = circuit.db.source_pin_missing_trace_warning.list()
  const warnedPorts = missingWarnings.map((w) => {
    const sp = circuit.db.source_port.get(w.source_port_id as string)
    return sp?.name
  })
  expect(warnedPorts).not.toContain("POS")
})
