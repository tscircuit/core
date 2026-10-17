import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("keepout without layers covers every copper layer of a four layer board", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="24mm" height="14mm" layers={4}>
      <keepout shape="rect" width="6mm" height="4mm" pcbX="-6mm" />
      <keepout shape="circle" radius="2mm" layers={["inner1"]} pcbX="6mm" />
      <pcbnotetext
        text="left keepout: no layers prop, all 4 copper layers"
        fontSize="0.4mm"
        pcbX={0}
        pcbY={5.5}
      />
      <pcbnotetext
        text="right keepout: layers={['inner1']} is left alone"
        fontSize="0.4mm"
        pcbX={0}
        pcbY={-5.5}
      />
    </board>,
  )

  circuit.render()

  const [defaultedKeepout, explicitKeepout] = circuit.db.pcb_keepout.list()

  expect(defaultedKeepout).toMatchObject({
    shape: "rect",
    layers: ["top", "bottom", "inner1", "inner2"],
  })
  expect(explicitKeepout).toMatchObject({
    shape: "circle",
    layers: ["inner1"],
  })

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
