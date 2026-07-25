import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const buildAndGetWarning = async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} />
      <net name="VCC" />
      <trace from=".R1 > .pin1" to="net.VCC" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const warning = circuit
    .getCircuitJson()
    .find((e: any) => e.type === "source_unnamed_trace_warning") as any

  return warning?.message as string | undefined
}

test("warning messages are identical for identical circuits", async () => {
  // `getString()` embeds `_renderId`, which comes from a module-level counter
  // that is never reset. Rendering the same board three times in one process
  // used to yield "trace#14", "trace#36", "trace#58" — so any consumer that
  // snapshots or diffs warnings sees spurious changes.
  const messages = [
    await buildAndGetWarning(),
    await buildAndGetWarning(),
    await buildAndGetWarning(),
  ]

  for (const message of messages) {
    expect(message).toBeDefined()
    expect(message).toContain("is missing a name")
  }

  expect(new Set(messages).size).toBe(1)
})

test("render ids stay distinct within a circuit", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <resistor name="R2" resistance="2k" footprint="0402" pcbX={5} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const strings = (circuit.selectAll("resistor") as any[]).map((r) =>
    r.getString(),
  )

  // Making the id circuit-relative must not collapse distinct components onto
  // the same identifier.
  expect(strings.length).toBe(2)
  expect(new Set(strings).size).toBe(2)
})
