import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbnoterect stays horizontal when its parent chip rotates 90 degrees", async () => {
  const { circuit } = getTestFixture({
    platform: { schematicDisabled: true },
  })

  const cases = [
    { name: "U1", x: -11, rotation: 0, usePath: false },
    { name: "U2", x: 0, rotation: 90, usePath: false },
    { name: "U3", x: 11, rotation: 90, usePath: true },
  ]

  circuit.add(
    <board width={36} height={13} routingDisabled>
      {cases.map(({ name, x, rotation, usePath }) => (
        <chip
          key={name}
          name={name}
          pcbX={x}
          pcbY={0}
          pcbRotation={rotation}
          pinLabels={{ pin1: "A", pin2: "B" }}
          footprint={
            <footprint>
              <smtpad
                pcbX={-2.5}
                pcbY={0}
                width={1.2}
                height={1.2}
                shape="rect"
                portHints={["pin1"]}
              />
              <smtpad
                pcbX={2.5}
                pcbY={0}
                width={1.2}
                height={1.2}
                shape="rect"
                portHints={["pin2"]}
              />
              {usePath ? (
                <pcbnotepath
                  route={[
                    { x: -4, y: -1.5 },
                    { x: 4, y: -1.5 },
                    { x: 4, y: 1.5 },
                    { x: -4, y: 1.5 },
                    { x: -4, y: -1.5 },
                  ]}
                  strokeWidth={0.15}
                  color="#00ffcc"
                />
              ) : (
                <pcbnoterect
                  width={8}
                  height={3}
                  strokeWidth={0.15}
                  color="#00ffcc"
                />
              )}
            </footprint>
          }
        />
      ))}
      {cases.map(({ name, x, rotation, usePath }) => (
        <Fragment key={name}>
          <pcbnotetext
            text={`${rotation} deg: ${usePath ? "path control" : "rectangle"}`}
            pcbX={x}
            pcbY={-5}
            fontSize={0.6}
          />
        </Fragment>
      ))}
    </board>,
  )

  await circuit.renderUntilSettled()

  // Record the bug: U2's pads rotate outside its horizontal note rectangle.
  // U3 uses the same outline as a path, which follows the parent rotation.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1200,
    height: 460,
    showPcbNotes: true,
  })
})
