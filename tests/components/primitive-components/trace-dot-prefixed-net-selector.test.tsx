import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A dot-prefixed net selector (".net.VBUS") once aborted the whole render: the
// decoupling probe walks connected traces, the net was never auto-created, and
// the unresolved net threw. It must now render like the canonical "net.VBUS".
test("dot-prefixed net selector (.net.VBUS) renders instead of aborting", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <capacitor name="C1" capacitance="100nF" footprint="0402" />
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          1: "VBAT",
          4: "GND",
        }}
        pinAttributes={{
          VBAT: { requiresPower: true },
        }}
      />
      <trace from=".U1 > .VBAT" to=".C1 > .1" />
      <trace from=".C1 > .2" to=".net.VBUS" />
    </board>,
  )

  circuit.render()

  expect(
    circuit.db.source_net.list().some((net) => net.name === "VBUS"),
  ).toBe(true)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
