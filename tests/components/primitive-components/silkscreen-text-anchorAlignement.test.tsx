import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const circuit1 = (
  <board width="50mm" height="50mm">
    <group pcbX={0} pcbY={0}>
      <silkscreencircle radius="0.25mm" />
      <silkscreentext text="Anchor Top Center" anchorAlignment="center" />
    </group>

    <group pcbX={0} pcbY={0}>
      <silkscreencircle radius="0.25mm" />
      <silkscreentext text="Anchor Center" anchorAlignment="center" />
    </group>

    <group pcbX={0} pcbY={0}>
      <silkscreencircle radius="0.25mm" />
      <silkscreentext text="Anchor Bottom Center" anchorAlignment="center" />
    </group>
  </board>
)

const circuit2 = (
  <board width="50mm" height="50mm">
    <group pcbX={0} pcbY={0}>
      <silkscreencircle radius="0.25mm" />
      <silkscreentext text="Anchor Top Center" anchorAlignment="top_center" />
    </group>

    <group pcbX={0} pcbY={0}>
      <silkscreencircle radius="0.25mm" />
      <silkscreentext text="Anchor Center" anchorAlignment="center" />
    </group>

    <group pcbX={0} pcbY={0}>
      <silkscreencircle radius="0.25mm" />
      <silkscreentext
        text="Anchor Bottom Center"
        anchorAlignment="bottom_center"
      />
    </group>
  </board>
)

test("SilkscreenText anchorAlignment", async () => {
  const { circuit: firstCircuit } = getTestFixture()
  firstCircuit.add(circuit1)
  firstCircuit.render()

  const firstCircuitJson = firstCircuit.getCircuitJson()
  const firstTextAlignments = firstCircuitJson
    .filter((elm) => elm.type === "pcb_silkscreen_text")
    .map((elm: any) => elm.anchor_alignment)

  expect(firstTextAlignments).toEqual(["center", "center", "center"])
  expect(firstCircuit).toMatchPcbSnapshot(`${import.meta.path}-circuit1`)

  const { circuit: secondCircuit } = getTestFixture()
  secondCircuit.add(circuit2)
  secondCircuit.render()

  const secondCircuitJson = secondCircuit.getCircuitJson()
  const secondTextAlignments = secondCircuitJson
    .filter((elm) => elm.type === "pcb_silkscreen_text")
    .map((elm: any) => elm.anchor_alignment)

  expect(secondTextAlignments).toEqual([
    "top_center",
    "center",
    "bottom_center",
  ])
  expect(secondCircuit).toMatchPcbSnapshot(`${import.meta.path}-circuit2`)
})
