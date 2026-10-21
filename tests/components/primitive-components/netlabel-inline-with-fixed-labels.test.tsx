import { expect, test } from "bun:test"
import { pointToSegmentDistance } from "@tscircuit/math-utils"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fixed labels preserve the wire carrying an inline net annotation", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board>
      <schematictext
        text="Fixed and inline labels on the same SIGNAL net"
        schX={-1}
        schY={2.8}
        fontSize={0.24}
      />
      <schematictext
        text="R1 and R2 have fixed labels; R3 has an inline label above its wire."
        schX={-1}
        schY={2.4}
        fontSize={0.18}
      />
      <schematictext
        text="Expected: the green wire beneath R3's SIGNAL text remains connected to R3."
        schX={-1}
        schY={2.05}
        fontSize={0.18}
      />
      <resistor
        name="R1"
        resistance="1k"
        schX={-5}
        connections={{ pin2: "net.SIGNAL" }}
      />
      <resistor
        name="R2"
        resistance="2k"
        schX={1}
        connections={{ pin1: "net.SIGNAL" }}
      />
      <resistor
        name="R3"
        resistance="3k"
        schX={3}
        schY={1}
        connections={{ pin1: "net.SIGNAL" }}
      />
      <netlabel
        net="SIGNAL"
        connection=".R1 > .pin2"
        schX={-4.7}
        schY={-1}
        anchorSide="top"
      />
      <netlabel
        net="SIGNAL"
        connection=".R2 > .pin1"
        schX={0.7}
        schY={-1}
        anchorSide="top"
      />
      <netlabel net="SIGNAL" connection=".R3 > .pin1" inline />
    </board>,
  )
  await circuit.renderUntilSettled()

  const inlineLabelTexts = circuit.db.schematic_text
    .list()
    .filter((text) => text.text === "SIGNAL" && text.source_trace_id)
  const edges = circuit.db.schematic_trace
    .list()
    .flatMap((trace) => trace.edges)
  expect(inlineLabelTexts.length).toBeGreaterThan(0)
  for (const inlineLabelText of inlineLabelTexts) {
    // Horizontal inline labels sit immediately above their wire. Check the
    // emitted text against the emitted traces in circuit-world mm (+Y up).
    expect(
      edges.some(
        (edge) =>
          pointToSegmentDistance(inlineLabelText.position, edge.from, edge.to) <
          1e-6,
      ),
    ).toBe(true)
  }
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
  })
})
