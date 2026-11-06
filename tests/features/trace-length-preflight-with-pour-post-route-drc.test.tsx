import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: declared-pour routing stops before the final length check", async () => {
  const { circuit } = getTestFixture()
  let autoroutingStartCount = 0
  circuit.on("autorouting:start", () => autoroutingStartCount++)

  circuit.add(
    <board
      width="20mm"
      height="12mm"
      layers={4}
      autorouter="auto-local"
      autorouterVersion="beta_pipeline7"
    >
      <pcbnotetext
        pcbY={-4}
        fontSize={0.7}
        text="GROUND STITCH EXCEEDS 0.1mm LIMIT"
      />
      <resistor name="R1" resistance="10k" footprint="0603" pcbX={-4} />
      <resistor name="R2" resistance="10k" footprint="0603" pcbX={4} />
      <trace
        name="ground_stitch"
        from=".R1 > .pin2"
        to="net.GND"
        maxLength="0.1mm"
      />
      <trace from=".R2 > .pin1" to="net.GND" />
      <copperpour layer="inner1" connectsTo="net.GND" unbroken />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: false,
  })

  expect(autoroutingStartCount).toBe(0)
  const routingErrors = circuit.db.pcb_autorouting_error.list()
  expect(routingErrors).toHaveLength(1)
  expect(routingErrors[0].message).toContain("maximum length")
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace_too_long_error.list()).toHaveLength(0)
  expect(
    circuit.db.source_trace.getWhere({ name: "ground_stitch" })!.max_length,
  ).toBe(0.1)
})
