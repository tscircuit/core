import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("mounting slots rotate with their connector at 90 degrees", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={60} height={28} routingDisabled>
      <pcbnotetext
        text="SLOTTED CONNECTOR: PADS, GUIDES AND SLOTS ROTATE TOGETHER"
        pcbY={12}
        fontSize={0.7}
      />
      {[0, 90].map((rotation, column) => (
        <Fragment key={rotation}>
          <pcbnotetext
            text={`${rotation}deg`}
            pcbX={column === 0 ? -15 : 15}
            pcbY={8.5}
            fontSize={0.9}
          />
          <chip
            name={`J${column + 1}`}
            pcbX={column === 0 ? -15 : 15}
            pcbRotation={rotation}
            pinLabels={{ pin1: "VCC", pin2: "GND", pin3: "SDA", pin4: "SCL" }}
            footprint={
              <footprint>
                {[-3.81, -1.27, 1.27, 3.81].map((x, i) => (
                  <Fragment key={x}>
                    <platedhole
                      portHints={[`pin${i + 1}`]}
                      pcbX={x}
                      shape="circle"
                      holeDiameter={0.9}
                      outerDiameter={1.7}
                    />
                  </Fragment>
                ))}
                {[-5.8, 5.8].map((x) => (
                  <Fragment key={x}>
                    <silkscreenpath
                      route={[
                        { x: x - 2, y: -0.9 },
                        { x: x + 2, y: -0.9 },
                        { x: x + 2, y: 0.9 },
                        { x: x - 2, y: 0.9 },
                        { x: x - 2, y: -0.9 },
                      ]}
                    />
                    <hole shape="pill" width={3.2} height={1.2} pcbX={x} />
                  </Fragment>
                ))}
              </footprint>
            }
          />
        </Fragment>
      ))}
    </board>,
  )

  circuit.render()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1200,
    height: 650,
  })
})
