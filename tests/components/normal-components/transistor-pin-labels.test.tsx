import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { Transistor } from "lib/components/normal-components/Transistor"

it("remaps transistor pins with pinLabels for SOT-23 B-E-C order", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <transistor
        name="Q1"
        type="npn"
        footprint="sot23"
        pinLabels={{ pin1: "base", pin2: "emitter", pin3: "collector" }}
      />
    </board>,
  )
  circuit.render()

  const q1 = circuit.selectOne(".Q1") as Transistor
  expect(q1.base._parsedProps.pinNumber).toBe(1)
  expect(q1.emitter._parsedProps.pinNumber).toBe(2)
  expect(q1.collector._parsedProps.pinNumber).toBe(3)

  const names = circuit.db.source_port
    .list()
    .map((p) => [p.pin_number, p.name])
    .sort()
  expect(names).toEqual([
    [1, "base"],
    [2, "emitter"],
    [3, "collector"],
  ])
  expect(circuit.selectOne(".Q1 > .b")).toBe(q1.base)
  expect(circuit.selectOne(".Q1 > .e")).toBe(q1.emitter)
  expect(circuit.selectOne(".Q1 > .c")).toBe(q1.collector)
})
