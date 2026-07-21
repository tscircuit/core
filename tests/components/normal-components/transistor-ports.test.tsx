import { expect, it } from "bun:test"
import { Transistor } from "lib/components/normal-components/Transistor"
import type { SchSymbol } from "schematic-symbols"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should have base, emitter, and collector port mappings", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q3" type="npn" schRotation={0} />
    </board>,
  )
  circuit.render()
  const transistorInstance = circuit.selectOne("Transistor") as Transistor
  expect(transistorInstance).toBeDefined()
  expect(transistorInstance.base).toBeDefined()
  expect(transistorInstance.emitter).toBeDefined()
  expect(transistorInstance.collector).toBeDefined()
})

it("should initialize base, emitter, and collector ports correctly for an NPN transistor", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q1" type="npn" schRotation={0} />
    </board>,
  )
  circuit.render()

  const components = circuit.db.pcb_component.list()
  expect(components).toHaveLength(1)
  const component = components[0]

  const ports = circuit.db.pcb_port.list()

  const base = ports.find(
    (port) => circuit.db.source_port.get(port.source_port_id!)?.name === "base",
  )
  const collector = ports.find(
    (port) =>
      circuit.db.source_port.get(port.source_port_id!)?.name === "collector",
  )
  const emitter = ports.find(
    (port) =>
      circuit.db.source_port.get(port.source_port_id!)?.name === "emitter",
  )

  expect(base).not.toBeNull()
  expect(collector).not.toBeNull()
  expect(emitter).not.toBeNull()
})

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

it("should expose accessors consistent with pin aliases (pin1=collector, pin2=base, pin3=emitter)", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q2" type="npn" />
    </board>,
  )
  circuit.render()
  const t = circuit.selectOne("Transistor") as Transistor
  expect(t.collector).toBe(t.portMap.pin1)
  expect(t.base).toBe(t.portMap.pin2)
  expect(t.emitter).toBe(t.portMap.pin3)
})
