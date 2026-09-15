import { expect, test } from "bun:test"
import type { Net } from "lib/components/primitive-components/Net"
import type { VoltageProbe } from "lib/components/primitive-components/VoltageProbe"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A voltageprobe whose target resolves to a port or net without a source id
// must skip only its own simulation output. It must not throw and abort the
// whole render. See VoltageProbe.doInitialSimulationRender.
test("voltageprobe with unresolved source skips its output without throwing", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        connections={{ pin1: ".VOUT" }}
      />
      <net name="VOUT" />
      <voltageprobe name="VP1" connectsTo=".VOUT" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const probe = circuit.selectOne("voltageprobe") as VoltageProbe
  const net = circuit.selectOne("net") as unknown as Net

  // Force the reported condition: the target net exists but has no source id.
  net.source_net_id = undefined

  const warnings: string[] = []
  const originalWarn = console.warn
  console.warn = (...args: unknown[]) => {
    warnings.push(args.map(String).join(" "))
  }

  try {
    expect(() => probe.doInitialSimulationRender()).not.toThrow()
  } finally {
    console.warn = originalWarn
  }

  // The warning names both the probe and the target selector so people can
  // find the offending probe.
  const warning = warnings.find((w) => w.includes("VP1"))
  expect(warning).toBeDefined()
  expect(warning).toContain(".VOUT")
})
