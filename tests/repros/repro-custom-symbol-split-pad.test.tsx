import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Minimal form of the repeated pin41 pads from tsci import C2913199 --jlcpcb.
// Geometry is synthetic: footprint-local millimetres, +X right, +Y up.
test("custom symbol skips split physical pad inference", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={8} routingDisabled>
      <chip
        name="U1"
        pinLabels={{ pin1: ["GND"] }}
        symbol={
          <symbol>
            <schematicrect width={1} height={1} />
            <schematictext text="{NAME}" schY={0.8} />
            <port
              name="pin1"
              pinNumber={1}
              aliases={["GND"]}
              direction="down"
              schX={0}
              schY={-0.7}
            />
          </symbol>
        }
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={-1.5}
              pcbY={0}
              width={1}
              height={1}
              shape="rect"
            />
            <smtpad
              portHints={["pin1"]}
              pcbX={1.5}
              pcbY={0}
              width={1}
              height={1}
              shape="rect"
            />
          </footprint>
        }
      />
      <pcbnotetext
        text="Two physical pads, one GND pin"
        pcbY={2}
        fontSize={0.45}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.source_ambiguous_port_reference.list()).toHaveLength(1)
  expect(circuit.db.pcb_port.list()).toHaveLength(0)
  expect(circuit.db.schematic_port.list()).toHaveLength(1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
