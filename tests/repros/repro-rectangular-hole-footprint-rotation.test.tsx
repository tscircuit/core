import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rectangular mounting hole stays horizontal when its footprint rotates", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={28} height={16} routingDisabled>
      {[0, 90].map((rotation, column) => (
        <Fragment key={rotation}>
          <pcbnotetext
            text={
              rotation === 0 ? "0 DEG CONTROL" : "90 DEG: HOLE STAYS HORIZONTAL"
            }
            pcbX={column === 0 ? -7 : 7}
            pcbY={6}
            fontSize={0.5}
          />
          <chip
            name={`J${column + 1}`}
            pcbX={column === 0 ? -7 : 7}
            pcbRotation={rotation}
            footprint={
              <footprint>
                {[-4, 4].map((x, pin) => (
                  <smtpad
                    key={x}
                    shape="rect"
                    width={0.6}
                    height={0.6}
                    pcbX={x}
                    portHints={[`pin${pin + 1}`]}
                  />
                ))}
                <silkscreenpath
                  strokeWidth={0.15}
                  route={[
                    { x: -3, y: -1 },
                    { x: 3, y: -1 },
                    { x: 3, y: 1 },
                    { x: -3, y: 1 },
                    { x: -3, y: -1 },
                  ]}
                />
                <hole shape="rect" width={6} height={2} />
              </footprint>
            }
          />
        </Fragment>
      ))}
      <pcbnotetext
        text="YELLOW = EXPECTED HOLE OUTLINE; PINK = ACTUAL HOLE"
        pcbY={-6}
        fontSize={0.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1200,
    height: 700,
    showPcbNotes: true,
    shouldDrawRatsNest: false,
    shouldDrawErrors: false,
    showErrorsInTextOverlay: false,
  })
})
