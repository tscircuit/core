import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbPack avoids rotated plated-hole copper across layers", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="14mm" height="10mm" pcbPack routingDisabled>
      <chip
        name="J1"
        pcbX={0}
        pcbY={0}
        pcbRotation={90}
        footprint={
          <footprint>
            <platedhole
              shape="pill"
              outerWidth="2mm"
              outerHeight="6mm"
              holeWidth="1mm"
              holeHeight="5mm"
              portHints={["pin1"]}
            />
          </footprint>
        }
      />

      <resistor name="R1" resistance="10k" footprint="0603" layer="bottom" />
      <trace from=".J1 > .pin1" to=".R1 > .pin1" />

      <pcbnotetext
        pcbY={4.2}
        text="BOTTOM SMT MUST AVOID ROTATED THROUGH-HOLE COPPER"
        fontSize="0.4mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
    shouldDrawRatsNest: true,
    showCourtyards: true,
  })

  expect(circuit.db.pcb_footprint_overlap_error.list()).toHaveLength(0)
})
