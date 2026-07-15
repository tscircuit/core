import { expect, test } from "bun:test"
import type { Port } from "lib/components/primitive-components/Port"
import type { Shell } from "lib/components/primitive-components/Shell"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("shell maps independently placed units to physical package pins", () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board width="60mm" height="30mm">
      <shell
        name="Q203"
        mpn="DMN65D8LDW"
        manufacturer="Diodes Inc."
        pinCount={6}
      >
        <mosfet
          unitId="A"
          channelType="n"
          mosfetMode="enhancement"
          schX={-10}
          schY={4}
          pinMapping={{ gate: "2", source: "1", drain: "6" }}
        />
        <mosfet
          unitId="B"
          refdesOverride="Q203-2"
          channelType="n"
          mosfetMode="enhancement"
          schX={10}
          schY={-4}
          pinMapping={{ gate: "5", source: "4", drain: "3" }}
        />
      </shell>
      <trace from=".Q203.pin2" to="net.PWM_A" />
      <trace from=".Q203B.gate" to="net.PWM_B" />
      <schematictext
        text="Q203: one package, independently placed units A and B"
        schX={0}
        schY={8}
        fontSize={0.6}
      />
    </board>,
  )

  circuit.render()

  const shell = circuit.selectOne(".Q203") as Shell
  expect(shell.pinMap()).toEqual({
    "1": "Q203A.source",
    "2": "Q203A.gate",
    "3": "Q203B.drain",
    "4": "Q203B.source",
    "5": "Q203B.gate",
    "6": "Q203A.drain",
  })
  const physicalGatePort = circuit.selectOne(".Q203.pin2") as Port
  const logicalGatePort = circuit.selectOne(".Q203A.gate") as Port
  const physicalSourcePort = physicalGatePort.source_port_id
    ? circuit.db.source_port.get(physicalGatePort.source_port_id)
    : null
  const logicalSourcePort = logicalGatePort.source_port_id
    ? circuit.db.source_port.get(logicalGatePort.source_port_id)
    : null
  expect(physicalSourcePort?.subcircuit_connectivity_map_key).toBeTruthy()
  expect(physicalSourcePort?.subcircuit_connectivity_map_key).toBe(
    logicalSourcePort?.subcircuit_connectivity_map_key,
  )
  expect(
    circuit.db.toArray().filter((element) => "error_type" in element),
  ).toEqual([])
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    drawPorts: true,
  })
})
