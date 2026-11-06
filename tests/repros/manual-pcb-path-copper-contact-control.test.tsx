import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual pcbPath still reports contact with unrelated copper", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={10} height={6} layers={4} schematicDisabled>
      <pinheader name="J1" pinCount={1} pcbX={-3} />
      <pinheader name="J2" pinCount={1} pcbX={3} />
      <pinheader name="J3_UNRELATED" pinCount={1} />
      <trace
        from=".J1 > .pin1"
        to=".J2 > .pin1"
        thickness={0.56}
        pcbPathRelativeTo="board"
        pcbPath={[{ x: 0, y: 0 }]}
      />
      <pcbnotetext
        text="Control: unrelated copper at center DOES produce an error"
        pcbY={2}
        fontSize={0.25}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  const errors = circuit
    .getCircuitJson()
    .filter((element) => element.type.endsWith("_error"))
  expect(errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        message: expect.stringMatching(/overlap|contact|short/i),
      }),
    ]),
  )
})
