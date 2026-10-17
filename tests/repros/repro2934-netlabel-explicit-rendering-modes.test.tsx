import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("netlabel supports explicit rendering modes (anchor, text, none) and anchor controls (#2934)", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" schX={-3} schY={0} />
      <resistor name="R2" resistance="1k" schX={3} schY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />

      <netlabel
        net="SIG_INTERNAL"
        connectsTo=".R1 > .pin2"
        {...({
          schLabelType: "text",
          displayLabel: "SIG_BUS",
          schTextPosition: 0.5,
          schTextGap: 0.3,
          schX: 99,
          schY: 99,
        } as any)}
      />

      <netlabel
        net="GND"
        connectsTo=".R1 > .pin1"
        schX={-5}
        schY={0}
        {...({
          schLabelType: "anchor",
          displayLabel: "AGND_REF",
          schAnchorSide: "left",
          schAnchorSymbol: "NONE",
        } as any)}
      />

      <netlabel
        net="HIDDEN_NET"
        connectsTo=".R2 > .pin2"
        {...({
          schLabelType: "none",
        } as any)}
      />
    </board>,
  )

  circuit.render()

  const netLabels = circuit.db.schematic_net_label.list()
  expect(netLabels).toHaveLength(1)
  expect(netLabels[0]?.text).toBe("AGND_REF")
  expect(netLabels[0]?.anchor_side).toBe("left")
  expect(netLabels[0]?.symbol_name).toBeUndefined()

  const traceTexts = circuit.db.schematic_text
    .list()
    .filter((t) => t.text === "SIG_BUS")
  expect(traceTexts).toHaveLength(1)
  expect(traceTexts[0]?.position.x).toBeCloseTo(0, 1)
  expect(traceTexts[0]?.position.y).toBeCloseTo(0.3, 1)

  const hiddenNet = circuit.db.source_net
    .list()
    .find((n) => n.name === "HIDDEN_NET")
  expect(hiddenNet).toBeDefined()
  expect(
    circuit.db.schematic_net_label
      .list()
      .some((nl) => nl.source_net_id === hiddenNet?.source_net_id),
  ).toBe(false)
})
