import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const buildAndGetWarning = async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <resistor name="R1" resistance="10k" footprint="0402" />
      <resistor name="R2" resistance="10k" footprint="0402" />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const warning = circuit
    .getCircuitJson()
    .find((e: any) => e.type === "source_unnamed_trace_warning") as any

  return warning?.message as string | undefined
}

test("warning messages are identical for identical circuits", async () => {
  // getString() used to embed the process-global _renderId, so rendering the
  // same unnamed-trace board three times in one process produced drifting
  // "trace#14" / "trace#36" / "trace#58" warning text. Snapshot/diff consumers
  // then saw spurious changes even though the circuit JSON was otherwise identical.
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

  expect(strings.length).toBe(2)
  expect(new Set(strings).size).toBe(2)
})
