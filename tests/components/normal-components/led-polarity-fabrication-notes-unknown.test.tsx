import { expect, test } from "bun:test"
import { Led } from "lib/components/normal-components/Led"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ambiguous polarity is rejected and custom footprints remain authored", async () => {
  expect(
    () =>
      new Led({
        name: "LED_CONFLICT",
        footprint: "0603",
        pinLabels: { pin1: ["anode", "cathode"], pin2: ["cathode"] },
      }),
  ).toThrow("conflicting positive and negative")
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
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.pcb_fabrication_note_text
      .list()
      .map((note) => note.text)
      .sort(),
  ).toEqual(["+", "-", "custom footprint"])
  expect(circuit.db.pcb_fabrication_note_path.list()).toHaveLength(4)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
