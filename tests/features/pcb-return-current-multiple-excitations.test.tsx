import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  ReturnCurrentBoard,
  returnCurrentExcitationProps,
} from "tests/fixtures/pcb-return-current-board"

test("one experiment can declare two independent routed signals sharing actual GND contacts", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <ReturnCurrentBoard>
      {[-2, 2].map((x, index) => (
        <chip
          key={index}
          name={`U${index + 3}`}
          pcbX={x}
          pcbY={-1.5}
          pinLabels={{ pin1: "SIGNAL" }}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                width={0.8}
                height={0.8}
                shape="rect"
              />
            </footprint>
          }
        />
      ))}
      <trace
        name="SECOND_SIGNAL"
        from=".U3 > .SIGNAL"
        to=".U4 > .SIGNAL"
        pcbStraightLine
      />
      <pcbreturncurrentsimulation name="Two isolated signal excitations">
        <pcbreturncurrentexcitation {...returnCurrentExcitationProps} />
        <pcbreturncurrentexcitation
          {...returnCurrentExcitationProps}
          source=".U3 > .SIGNAL"
          load=".U4 > .SIGNAL"
          current="10mA"
          trace=".SECOND_SIGNAL"
        />
      </pcbreturncurrentsimulation>
      <pcbnotetext text="U1.OUT → U2.IN: 5 mA" pcbY={0.65} fontSize={0.35} />
      <pcbnotetext
        text="U3.SIGNAL → U4.SIGNAL: 10 mA"
        pcbY={-2.3}
        fontSize={0.35}
      />
    </ReturnCurrentBoard>,
  )
  await circuit.renderUntilSettled()
  const [first, second] = circuit.db.simulation_return_current_excitation.list()
  expect(first.simulation_experiment_id).toBe(second.simulation_experiment_id)
  expect(first.pcb_trace_id).not.toBe(second.pcb_trace_id)
  expect(first.ground_source_net_id).toBe(second.ground_source_net_id)
  expect(first.return_source).toEqual(second.return_source)
  expect(first.return_sink).toEqual(second.return_sink)
  expect([first.current, second.current]).toEqual([0.005, 0.01])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
