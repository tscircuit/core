import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const CustomSymbolPortDirectionCircuit = () => (
  <board width="18mm" height="12mm">
    <chip
      name="HOST"
      symbol={
        <symbol>
          <schematicpath
            points={[
              { x: -6, y: 0.5 },
              { x: -4.8, y: 0.5 },
              { x: -4.8, y: -0.5 },
              { x: -6, y: -0.5 },
              { x: -6, y: 0.5 },
            ]}
            isFilled={false}
            strokeWidth={0.02}
            dashLength={0.3}
            dashGap={0.15}
          />
          <schematictext
            text="HOST"
            schX={-5.4}
            schY={0}
            color="red"
            fontSize={0.16}
          />
          <port
            name="pin1"
            direction="right"
            schX={-4.5}
            schY={0}
            schStemLength={0.3}
          />
        </symbol>
      }
      connections={{ pin1: "net.SIG" }}
    />
  </board>
)

test("repro127: custom symbol port direction is used for fallback netlabels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<CustomSymbolPortDirectionCircuit />)

  await circuit.renderUntilSettled()

  const hostPort = circuit.db.schematic_port
    .list()
    .find((port) => port.center.x === -4.5 && port.center.y === 0)

  expect(hostPort?.facing_direction).toBe("left")
  expect(circuit.db.schematic_net_label.list()[0]).toMatchObject({
    anchor_side: "right",
  })
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
