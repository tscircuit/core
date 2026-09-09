import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("only labels LEDs with unambiguous polarity and distinguishes unconnected pins", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={42} height={10} routingDisabled>
      <led name="LED_DEFAULT" footprint="0603" pcbX={-12} />
      <led
        name="LED_UNKNOWN"
        pcbX={4}
        pinLabels={{ pin1: ["terminal1"], pin2: ["terminal2"] }}
      >
        <footprint>
          <smtpad
            shape="rect"
            width={0.8}
            height={0.8}
            pcbX={-0.75}
            portHints={["1"]}
          />
          <smtpad
            shape="rect"
            width={0.8}
            height={0.8}
            pcbX={0.75}
            portHints={["2"]}
          />
          <fabricationnotetext
            text="custom footprint"
            pcbY={-2}
            fontSize={0.5}
          />
        </footprint>
      </led>
      <led
        name="LED_CONFLICT"
        footprint="0603"
        pcbX={15}
        pinLabels={{ pin1: ["anode", "cathode"], pin2: ["cathode"] }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.pcb_fabrication_note_text
      .list()
      .map((note) => note.text)
      .sort(),
  ).toEqual([
    "A (+) -> unconnected",
    "K (-) -> unconnected",
    "custom footprint",
  ])
  expect(circuit.db.pcb_fabrication_note_path.list()).toHaveLength(4)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
