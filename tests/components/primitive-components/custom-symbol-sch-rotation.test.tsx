import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom symbol schRotation reproduction", () => {
  const { circuit } = getTestFixture()
  const cases = [0, 90, 180, 270, -90, 450].map((rotation) => ({ rotation }))

  circuit.add(
    <board width={20} height={20} routingDisabled>
      <group schX={2} schY={3}>
        {cases.map(({ rotation }, i) => (
          <chip
            key={rotation}
            name={`S${rotation}`}
            schX={i * 2}
            schY={1}
            schRotation={rotation}
            footprint={
              <footprint>
                <smtpad shape="rect" width={1} height={1} portHints={["1"]} />
              </footprint>
            }
            symbol={
              <symbol>
                <schematicpath
                  points={[
                    { x: -0.5, y: -0.3 },
                    { x: 0.3, y: -0.3 },
                    { x: 0.5, y: 0 },
                    { x: 0.3, y: 0.3 },
                    { x: -0.5, y: 0.3 },
                    { x: -0.5, y: -0.3 },
                  ]}
                  strokeWidth={0.05}
                />
                <port
                  name="1"
                  direction="right"
                  schX={0.5}
                  schY={0}
                  schStemLength={0.2}
                />
              </symbol>
            }
          />
        ))}
        {cases.map(({ rotation }, i) => (
          <Fragment key={rotation}>
            <schematictext
              schX={i * 2}
              schY={-0.2}
              text={`${rotation} deg`}
              fontSize={0.2}
            />
          </Fragment>
        ))}
      </group>
    </board>,
  )
  circuit.render()

  // Reproduces #4697: every arrow points right despite the rotation below it.
  // The fix PR updates this snapshot to show the requested rotations.
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
