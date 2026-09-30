import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { EnclosureApertureDrcFixture } from "tests/fixtures/enclosure-aperture-drc-fixture"

test("a failed model fetch produces an explicit incomplete assembly check", async () => {
  const server = Bun.serve({
    port: 0,
    fetch: () => new Response("missing", { status: 404 }),
  })
  try {
    const { circuit } = getTestFixture()
    circuit.add(
      <EnclosureApertureDrcFixture objUrl={`${server.url}missing.obj`} />,
    )
    await circuit.renderUntilSettled()
    expect(
      circuit.db.cad_enclosure_aperture_intersection_warning.list(),
    ).toHaveLength(0)
    expect(circuit.db.source_runtime_error.list()).toHaveLength(1)
    expect(circuit.db.source_runtime_error.list()[0]).toMatchObject({
      phase_name: "AssemblyDesignRuleChecks",
    })
    expect(circuit.db.source_runtime_error.list()[0]!.message).toContain(
      "could not check",
    )
  } finally {
    server.stop(true)
  }
})
