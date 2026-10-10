import { simulation } from "lib"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  ReturnCurrentBoard,
  returnCurrentExcitationProps,
} from "tests/fixtures/pcb-return-current-board"

test("one experiment cannot mix two electrically separate return ground nets", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <ReturnCurrentBoard>
      <net name="OTHER_GND" />
      {[-2, 2].map((x, index) => (
        <chip
          key={index}
          name={`U${index + 3}`}
          pcbX={x}
          pcbY={-1.5}
          pinLabels={{ pin1: "SIGNAL", pin2: "GND" }}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                width={0.6}
                height={0.6}
                shape="rect"
              />
              <smtpad
                portHints={["pin2"]}
                pcbY={-0.8}
                width={0.6}
                height={0.6}
                shape="rect"
              />
            </footprint>
          }
        />
      ))}
      <trace from=".U3 > .SIGNAL" to=".U4 > .SIGNAL" pcbStraightLine />
      <trace from=".U3 > .GND" to="net.OTHER_GND" />
      <trace from=".U4 > .GND" to="net.OTHER_GND" />
      <simulation.pcbreturncurrentsimulation>
        <simulation.pcbreturncurrentexcitation
          {...returnCurrentExcitationProps}
        />
        <simulation.pcbreturncurrentexcitation
          {...returnCurrentExcitationProps}
          source=".U3 > .SIGNAL"
          load=".U4 > .SIGNAL"
          ground="net.OTHER_GND"
          returnSource=".U4 > .GND"
          returnSink=".U3 > .GND"
        />
      </simulation.pcbreturncurrentsimulation>
    </ReturnCurrentBoard>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    "must use the same ground net",
  )
})
