import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const TwoPadWithNotes = (props: { name: string; pcbX: number }) => (
  <chip
    name={props.name}
    pcbX={props.pcbX}
    footprint={
      <footprint>
        <smtpad
          shape="rect"
          pcbX={-1}
          pcbY={0}
          width={0.8}
          height={1}
          portHints={["1"]}
        />
        <smtpad
          shape="rect"
          pcbX={1}
          pcbY={0}
          width={0.8}
          height={1}
          portHints={["2"]}
        />
        <fabricationnotetext text="{REF}" pcbY={1.5} fontSize={0.8} />
        <fabricationnotetext
          text={"${REFERENCE} / {REF}"}
          pcbY={2.5}
          fontSize={0.3}
        />
        <coppertext text="{REFERENCE}" pcbY={0} fontSize={0.6} />
        <pcbnotetext text="{NAME}" pcbY={-1.5} fontSize={0.8} />
      </footprint>
    }
  />
)

test("resolves component name placeholders in fabrication note, copper, and pcb note text", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="10mm">
      <TwoPadWithNotes name="U1" pcbX={-4} />
      <TwoPadWithNotes name="U2" pcbX={4} />
      <fabricationnotetext text="REV A" pcbX={0} pcbY={3.5} fontSize={0.8} />
    </board>,
  )

  circuit.render()

  expect(
    circuit.db.pcb_fabrication_note_text.list().map((item) => item.text),
  ).toEqual(["U1", "${REFERENCE} / U1", "U2", "${REFERENCE} / U2", "REV A"])

  expect(circuit.db.pcb_copper_text.list().map((item) => item.text)).toEqual([
    "U1",
    "U2",
  ])

  expect(circuit.db.pcb_note_text.list().map((item) => item.text)).toEqual([
    "U1",
    "U2",
  ])

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
