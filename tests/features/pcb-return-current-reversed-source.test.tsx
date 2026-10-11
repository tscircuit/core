import { simulation } from "lib"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  ReturnCurrentBoard,
  returnCurrentExcitationProps,
} from "tests/fixtures/pcb-return-current-board"

test("opposite signal directions select one PCB route without reversing existing geometry", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <ReturnCurrentBoard>
      <simulation.pcbreturncurrentsimulation name="Forward excitation">
        <simulation.pcbreturncurrentexcitation
          {...returnCurrentExcitationProps}
        />
      </simulation.pcbreturncurrentsimulation>
      <simulation.pcbreturncurrentsimulation name="Reverse excitation">
        <simulation.pcbreturncurrentexcitation
          {...returnCurrentExcitationProps}
          source=".U2 > .IN"
          load=".U1 > .OUT"
          returnSource=".U1 > .GND"
          returnSink=".U2 > .GND"
        />
      </simulation.pcbreturncurrentsimulation>
      <pcbnotetext
        text="One route; two excitation directions"
        pcbY={-1.6}
        fontSize={0.4}
      />
    </ReturnCurrentBoard>,
  )
  await circuit.renderUntilSettled()
  const [forward, reverse] =
    circuit.db.simulation_return_current_excitation.list()
  expect(forward.pcb_trace_id).toBe(reverse.pcb_trace_id)
  expect(forward.return_source).toEqual(reverse.return_sink)
  expect(forward.return_sink).toEqual(reverse.return_source)
  const trace = circuit.db.pcb_trace.get(forward.pcb_trace_id)!
  expect(trace.route[0]).toMatchObject({ x: -2, y: 0 })
  expect(trace.route.at(-1)).toMatchObject({ x: 2, y: 0 })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
