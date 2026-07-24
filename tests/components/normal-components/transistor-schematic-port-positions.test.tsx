import { expect, it } from "bun:test"
import type { SchSymbol } from "schematic-symbols"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should place collector/base/emitter schematic ports at the symbol's matching port locations (npn + pnp)", async () => {
  const { symbols } = await import("schematic-symbols")

  for (const type of ["npn", "pnp"] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width="10mm" height="10mm">
        <transistor name="Q1" type={type} />
      </board>,
    )
    circuit.render()

    const symbol: SchSymbol = (
      type === "npn"
        ? symbols.npn_bipolar_transistor_horz
        : symbols.pnp_bipolar_transistor_horz
    )!
    expect(symbol).toBeDefined()

    for (const portName of ["collector", "base", "emitter"]) {
      const symbolPort = symbol.ports.find((p) => p.labels.includes(portName))!
      const schPort = circuit.db.schematic_port
        .list()
        .find(
          (sp) =>
            circuit.db.source_port.get(sp.source_port_id!)?.name === portName ||
            circuit.db.source_port
              .get(sp.source_port_id!)
              ?.port_hints?.includes(portName),
        )!
      expect(schPort).toBeDefined()
      expect(schPort.center.x).toBeCloseTo(symbolPort.x, 1)
      expect(schPort.center.y).toBeCloseTo(symbolPort.y, 1)
    }
  }
})
