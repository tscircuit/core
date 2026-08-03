import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const addRoutableBoard = (
  circuit: ReturnType<typeof getTestFixture>["circuit"],
  autorouter: "sequential-trace" | "auto-cloud",
) => {
  circuit.add(
    <board width="10mm" height="8mm" autorouter={autorouter}>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      <pcbnotetext
        text={`${autorouter} is disabled by default`}
        fontSize={0.4}
        pcbY={-3}
      />
    </board>,
  )
}

test("legacy autorouters are disabled unless the platform allows them", async () => {
  for (const autorouter of ["sequential-trace", "auto-cloud"] as const) {
    const { circuit } = getTestFixture()
    addRoutableBoard(circuit, autorouter)

    await circuit.renderUntilSettled()

    expect(circuit.db.pcb_trace.list()).toHaveLength(0)
    expect(circuit.db.source_property_ignored_warning.list()).toEqual([
      expect.objectContaining({
        property_name: "autorouter",
        message: expect.stringContaining("<autoroutingphase />"),
      }),
    ])
    expect(
      circuit.db.source_property_ignored_warning.list()[0]?.message,
    ).toContain(autorouter.replace(/-/g, "_"))
    expect(
      circuit.db.source_property_ignored_warning.list()[0]?.message,
    ).toContain("default autorouter")
    expect(
      circuit.db.source_property_ignored_warning.list()[0]?.message,
    ).toContain("<fanout />")
  }

  const { circuit: phasedLegacyCircuit } = getTestFixture()
  phasedLegacyCircuit.add(
    <board width="10mm" height="8mm" autorouter="default">
      <autoroutingphase autorouter="auto-cloud" />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  await phasedLegacyCircuit.renderUntilSettled()

  expect(phasedLegacyCircuit.db.pcb_trace.list()).toHaveLength(0)
  expect(
    phasedLegacyCircuit.db.source_property_ignored_warning.list()[0]?.message,
  ).toContain("auto_cloud")

  const { circuit: legacyCircuit } = getTestFixture({
    platform: {
      allowLegacyAutorouters: true,
    },
  })
  addRoutableBoard(legacyCircuit, "sequential-trace")

  legacyCircuit.render()

  expect(legacyCircuit.db.pcb_trace.list()).toHaveLength(1)
  expect(legacyCircuit.db.source_property_ignored_warning.list()).toHaveLength(
    0,
  )
})
