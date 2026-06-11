import { expect, test } from "bun:test"
import { createSchematicTraceSolverInputProblem } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/createSchematicTraceSolverInputProblem"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const HostCustomSymbolPassivesCircuit = () => (
  <board width="10mm" height="10mm">
    <resistor resistance="1k" footprint="0402" name="R1" />
    <capacitor capacitance="1000pF" footprint="0402" name="C1" />
    <chip
      name="HOST"
      symbol={
        <symbol>
          <schematicpath
            points={[
              { x: -6, y: 0.5 },
              { x: -4.8, y: 0.5 },
              { x: -4.8, y: -2.8 },
              { x: -6, y: -2.8 },
              { x: -6, y: 0.5 },
            ]}
            isFilled={false}
            strokeWidth={0.02}
            dashLength={0.3}
            dashGap={0.15}
          />
          <port
            name="pin1"
            direction="right"
            schStemLength={0.3}
            schX={-4.5}
            schY={0.1}
          />
          <port
            name="pin2"
            direction="right"
            schX={-4.5}
            schY={-0.3}
            schStemLength={0.3}
          />
          <port
            name="pin3"
            direction="right"
            schX={-4.5}
            schY={-0.7}
            schStemLength={0.3}
          />
          <port
            name="pin4"
            direction="right"
            schX={-4.5}
            schY={-2.45}
            schStemLength={0.3}
          />
        </symbol>
      }
      connections={{
        pin1: "C1.pin1",
        pin2: "R1.pin1",
        pin3: "C1.pin2",
        pin4: "R1.pin2",
      }}
    />
  </board>
)

test("repro129: host custom symbol connected to passives schematic", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<HostCustomSymbolPassivesCircuit />)

  await circuit.renderUntilSettled()

  const { inputProblem } = createSchematicTraceSolverInputProblem(
    circuit.children[0] as any,
  )
  expect(inputProblem.directConnections.map((conn) => conn.pinIds)).toEqual([
    ["HOST.pin1", "C1.1"],
    ["HOST.pin2", "R1.1"],
    ["HOST.pin3", "C1.2"],
    ["HOST.pin4", "R1.2"],
  ])
  expect(
    circuit.db.schematic_net_label
      .list()
      .every((netLabel) => !netLabel.text?.includes("undefined")),
  ).toBe(true)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
