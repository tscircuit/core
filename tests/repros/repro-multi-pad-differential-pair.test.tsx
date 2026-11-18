import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("reproduces differential pair routing failure with three pads per signal", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={19} height={10} schematicDisabled>
      <pinheader name="A" pinCount={2} pcbX={-6} pcbRotation={90} />
      <pinheader name="B" pinCount={2} pcbRotation={90} />
      <pinheader name="C" pinCount={2} pcbX={6} pcbRotation={90} />

      <trace name="D_P" path={["A.pin1", "B.pin1", "C.pin1"]} />
      <trace name="D_N" path={["A.pin2", "B.pin2", "C.pin2"]} />
      <differentialpair positiveConnection="D_P" negativeConnection="D_N" />

      <pcbnotetext
        pcbX={0}
        pcbY={-3.6}
        fontSize={0.45}
        text="D+ connects pin 1 on A, B, and C. D- connects pin 2."
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toMatchObject([
    {
      message: expect.stringContaining(
        "must resolve to exactly one final point-pair connection, got 2",
      ),
    },
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
