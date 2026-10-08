import { expect, test } from "bun:test"
import type { PcbReturnCurrentExcitationProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  ReturnCurrentBoard,
  returnCurrentExcitationProps,
} from "tests/fixtures/pcb-return-current-board"

test("invalid selectors, ground membership and terminal layers report readable errors", async () => {
  const cases: Array<{
    props: Partial<PcbReturnCurrentExcitationProps>
    message: string
  }> = [
    {
      props: { source: ".MISSING > .OUT" },
      message:
        'Signal source selector ".MISSING > .OUT" must identify exactly one physical PCB port',
    },
    {
      props: { source: ".U1 > port" },
      message:
        'Signal source selector ".U1 > port" must identify exactly one physical PCB port',
    },
    {
      props: { ground: "net.OTHER" },
      message:
        'Return contact ".U2 > .GND" is not electrically connected to ground net "OTHER"',
    },
    {
      props: { returnSink: ".U1 > .OUT" },
      message: "four distinct physical PCB ports",
    },
    {
      props: { returnSource: ".U2 > .IN" },
      message: "four distinct physical PCB ports",
    },
    {
      props: { returnSinkLayer: "bottom" },
      message:
        'Return sink ".U1 > .GND" has no physical port on layer "bottom"',
    },
    {
      props: { trace: ".MISSING" },
      message:
        'Trace selector ".MISSING" must identify exactly one routed source trace',
    },
    {
      props: { trace: "trace" },
      message:
        'Trace selector "trace" must identify exactly one routed source trace',
    },
  ]
  for (const { props, message } of cases) {
    const { circuit } = getTestFixture()
    circuit.add(
      <ReturnCurrentBoard>
        <net name="OTHER" />
        <pcbreturncurrentsimulation name="Invalid terminal example">
          <pcbreturncurrentexcitation
            {...returnCurrentExcitationProps}
            {...props}
          />
        </pcbreturncurrentsimulation>
      </ReturnCurrentBoard>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(message)
    expect(circuit.db.simulation_return_current_excitation.list()).toHaveLength(
      0,
    )
  }
})
