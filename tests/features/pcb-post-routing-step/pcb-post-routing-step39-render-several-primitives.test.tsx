import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("render can return several primitives, e.g. a pad and its silkscreen", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="8mm">
      <chip
        name="U1"
        pcbX={0}
        pcbY={0}
        footprint={
          <footprint>
            <platedhole
              shape="circle"
              holeDiameter={0.8}
              outerDiameter={1.3}
              portHints={["1"]}
              pcbX={0}
              pcbY={0}
            />
            <pcbpostroutingstep
              render={() => (
                <>
                  <smtpad
                    shape="circle"
                    radius={0.35}
                    portHints={["1"]}
                    pcbX={0.8}
                    pcbY={0.8}
                    layer="top"
                  />
                  <silkscreenpath
                    route={[
                      { x: -1, y: 1 },
                      { x: -1, y: -1 },
                      { x: 1, y: -1 },
                    ]}
                    strokeWidth={0.1}
                  />
                </>
              )}
            />
          </footprint>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const cj = circuit.getCircuitJson()
  expect(cj.filter((e) => e.type === "pcb_smtpad")).toHaveLength(1)
  expect(cj.filter((e) => e.type === "pcb_silkscreen_path")).toHaveLength(1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
