import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("bolts reject missing, ambiguous, invalid, cross-device and cyclic fastening targets", () => {
  for (const [content, message] of [
    [
      <>
        <board width={30} height={30}>
          <hole name="H" diameter={3.2} />
        </board>
        <assembly.bolt name="B" model="hexsocketbolt_m3_l10mm" fastenedTo="[" />
      </>,
      /invalid mounting selector/,
    ],
    [
      <>
        <board width={30} height={30}>
          <hole name="H" diameter={3.2} />
        </board>
        <assembly.bolt
          name="B"
          model="hexsocketbolt_m3_l10mm"
          fastenedTo=".MISSING"
        />
      </>,
      /matched 0 reference faces/,
    ],
    [
      <>
        <board width={30} height={30}>
          <hole name="H" pcbX={-5} diameter={3.2} />
          <hole name="H" pcbX={5} diameter={3.2} />
        </board>
        <assembly.bolt
          name="B"
          model="hexsocketbolt_m3_l10mm"
          fastenedTo=".H"
        />
      </>,
      /matched 2 reference faces/,
    ],
    [
      <>
        <assembly.device name="OTHER">
          <board width={30} height={30}>
            <hole name="H" diameter={3.2} />
          </board>
        </assembly.device>
        <assembly.bolt
          name="B"
          model="hexsocketbolt_m3_l10mm"
          fastenedTo=".H"
        />
      </>,
      /matched 0 reference faces/,
    ],
    [
      <>
        <assembly.bolt
          name="B1"
          model="hexsocketbolt_m3_l10mm"
          fastenedTo=".B2 > .base"
        />
        <assembly.bolt
          name="B2"
          model="hexsocketbolt_m3_l10mm"
          fastenedTo=".B1 > .base"
        />
      </>,
      /mounting cycle.*B1.*B2/,
    ],
    [
      <assembly.bolt name="BAD" diameter={3} length={10} threadPitch={0.7} />,
      /Bolt "BAD" has an unsupported model/,
    ],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(<assembly.device>{content}</assembly.device>)
    expect(() => circuit.render()).toThrow(message)
  }
})
