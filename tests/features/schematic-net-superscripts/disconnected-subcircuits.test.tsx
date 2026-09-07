import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("disconnected same-name nets get stable superscripts on regular and inline labels", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board width={30} height={20} schMaxTraceDistance={10}>
      {["A", "B"].map((name, index) => (
        <subcircuit key={name} name={name} schY={index * -4}>
          <resistor name={`R${index * 2 + 1}`} resistance="1k" schX={-3} />
          <resistor name={`R${index * 2 + 2}`} resistance="2k" schX={3} />
          <netlabel net="GND" connectsTo={`R${index * 2 + 1}.pin1`} schX={-5} />
          <netlabel net="SIGNAL" connectsTo={`R${index * 2 + 1}.pin2`} inline />
          <trace from={`R${index * 2 + 2}.pin1`} to="net.SIGNAL" />
          <netlabel
            net={`UNIQUE_${name}`}
            connectsTo={`R${index * 2 + 2}.pin2`}
            schX={5}
          />
        </subcircuit>
      ))}
    </board>,
  )
  let suffixesAtPhaseEnd: Array<string | undefined> = []
  circuit.on("renderable:renderLifecycle:anyEvent", (event) => {
    if (
      event.type ===
        "renderable:renderLifecycle:SchematicLabelNetsWithConflictingNames:end" &&
      event.renderId === circuit.firstChild!._renderId
    ) {
      suffixesAtPhaseEnd = circuit.db.schematic_net_label
        .list()
        .filter((label) => label.text === "GND")
        .map((label) => label.display_superscript)
    }
  })
  await circuit.renderUntilSettled()
  expect(new Set(suffixesAtPhaseEnd)).toEqual(new Set(["1", "2"]))

  const groundLabels = circuit.db.schematic_net_label
    .list()
    .filter((label) => label.text === "GND")
  const signalLabels = circuit.db.schematic_text
    .list()
    .filter((label) => label.text === "SIGNAL")
  expect(
    new Set(groundLabels.map((label) => label.display_superscript)),
  ).toEqual(new Set(["1", "2"]))
  expect(
    new Set(signalLabels.map((label) => label.display_superscript)),
  ).toEqual(new Set(["1", "2"]))
  expect(
    circuit.db.schematic_net_label
      .list()
      .filter((label) => label.text.startsWith("UNIQUE_"))
      .every((label) => label.display_superscript === undefined),
  ).toBe(true)
  const before = [...groundLabels, ...signalLabels].map(
    (label) => label.display_superscript,
  )
  circuit.render()
  expect(
    [
      ...circuit.db.schematic_net_label
        .list()
        .filter((label) => label.text === "GND"),
      ...circuit.db.schematic_text
        .list()
        .filter((label) => label.text === "SIGNAL"),
    ].map((label) => label.display_superscript),
  ).toEqual(before)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
