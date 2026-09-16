import { Fragment } from "react"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

export async function renderBottomPour({
  excludeJ2 = false,
}: { excludeJ2?: boolean } = {}) {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={10}
      height={10}
      layers={2}
      // Keep routing checks enabled, but generate no conventional GND tracks.
      autorouter={{ algorithmFn: createBasicAutorouter(async () => []) }}
    >
      <net name="GND" />
      {(["J1", "J2"] as const).map((name) => (
        <Fragment key={name}>
          <chip
            name={name}
            pcbX={name === "J1" ? -2 : 2}
            pinLabels={{ pin1: "GND" }}
            footprint={
              <footprint>
                <platedhole
                  portHints={["1"]}
                  holeDiameter={0.8}
                  outerDiameter={1.4}
                  shape="circle"
                />
                <courtyardcircle radius={1} />
              </footprint>
            }
          />
          <trace from={`${name}.pin1`} to="net.GND" />
          <pcbnotetext
            text={`${name}.GND`}
            pcbX={name === "J1" ? -2 : 2}
            pcbY={1.3}
            fontSize={0.35}
          />
        </Fragment>
      ))}
      <via
        name="VGND"
        pcbX={0}
        pcbY={0}
        holeDiameter={0.3}
        outerDiameter={0.6}
        connectsTo="net.GND"
      />
      <copperpour
        layer="bottom"
        connectsTo="net.GND"
        clearance={0.16}
        boardEdgeMargin={0.31}
        outline={
          excludeJ2
            ? [
                { x: -4.69, y: -4.69 },
                { x: 0.8, y: -4.69 },
                { x: 0.8, y: 4.69 },
                { x: -4.69, y: 4.69 },
              ]
            : undefined
        }
      />
      <pcbnotetext
        text="GND: bottom pour, no tracks"
        pcbY={3.5}
        fontSize={0.4}
      />
      <pcbnotetext
        text={
          excludeJ2
            ? "J2 outside fill: real disconnect"
            : "Both pads touch one fill"
        }
        pcbY={-2.5}
        fontSize={0.4}
      />
      <pcbnotetext
        text={
          excludeJ2
            ? "J2 must remain an error"
            : "BUG #3901: both reported disconnected"
        }
        pcbY={-3.3}
        fontSize={0.35}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  return circuit
}
