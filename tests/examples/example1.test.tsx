import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("example1", async () => {
  const { circuit, logSoup } = getTestFixture()
  circuit.add(
    <board width="12mm" height="10mm" autorouter="sequential-trace">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "PWR", pin8: "GND" }}
        pcbX={0}
        pcbY={0}
      />
      <resistor
        name="R1"
        footprint="0402"
        resistance="10k"
        pullupFor=".U1 port.2"
        pullupTo="net.5v"
        pcbX={-4}
        pcbY={0}
        pcbRotation={-90}
      />
      <capacitor
        name="C1"
        capacitance="10uF"
        footprint="0603"
        decouplingFor=".U1 port.PWR"
        decouplingTo="net.gnd"
        pcbX={4}
        pcbY={0}
        pcbRotation={-90}
      />
      <jumper pcbX={0} pcbY={-4} name="J1" footprint="pinrow4" />

      <trace from=".U1 .PWR" to="net.5v" />
      <trace from=".U1 .GND" to="net.gnd" />

      <trace from=".J1 pin.1" to="net.5v" />
      <trace from=".J1 pin.2" to=".U1 port.2" />
      <trace from=".J1 pin.3" to=".U1 port.3" />
      <trace from=".J1 pin.4" to="net.gnd" />

      <tracehint for=".C1 pin.1" offset={{ x: -2, y: 3 }} />
    </board>,
  )

  circuit.render()

  // the PcbPortAttachment phase should configure all the port ids
  expect(
    circuit.db.pcb_smtpad.list().map((smtpad) => smtpad.pcb_port_id),
  ).not.toContain(null)

  // We should have a cad_component for each component
  const cadComponents = circuit.db.cad_component.list()
  expect(cadComponents).toHaveLength(4)

  await expect(
    circuit.getSvg({
      view: "pcb",
      layer: "top",
    }),
  ).toMatchSvgSnapshot(import.meta.path, "example1")
})
