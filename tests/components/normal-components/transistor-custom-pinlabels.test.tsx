import { expect, it } from "bun:test"
import { Transistor } from "lib/components/normal-components/Transistor"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should map transistor functional roles to pins matching user-provided pinLabels (Issue #4775)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <transistor
        name="Q1"
        type="npn"
        footprint="sot23"
        pinLabels={{ pin1: "base", pin2: "emitter", pin3: "collector" }}
      />
    </board>,
  )

  circuit.render()

  const q1 = circuit.selectOne("Transistor") as Transistor
  expect(q1).toBeDefined()
  expect(q1.base).toBe(q1.portMap.pin1)
  expect(q1.emitter).toBe(q1.portMap.pin2)
  expect(q1.collector).toBe(q1.portMap.pin3)

  expect(q1.base.getNameAndAliases()).toContain("pin1")
  expect(q1.base.getNameAndAliases()).toContain("base")
  expect(q1.base.getNameAndAliases()).toContain("b")

  expect(q1.emitter.getNameAndAliases()).toContain("pin2")
  expect(q1.emitter.getNameAndAliases()).toContain("emitter")
  expect(q1.emitter.getNameAndAliases()).toContain("e")

  expect(q1.collector.getNameAndAliases()).toContain("pin3")
  expect(q1.collector.getNameAndAliases()).toContain("collector")
  expect(q1.collector.getNameAndAliases()).toContain("c")
})

it("should support array pinLabels on transistor", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <transistor
        name="Q2"
        type="npn"
        footprint="sot23"
        pinLabels={["base", "emitter", "collector"]}
      />
    </board>,
  )

  circuit.render()

  const q2 = circuit.selectOne("Transistor") as Transistor
  expect(q2).toBeDefined()
  expect(q2.base).toBe(q2.portMap.pin1)
  expect(q2.emitter).toBe(q2.portMap.pin2)
  expect(q2.collector).toBe(q2.portMap.pin3)
})

it("should support short aliases in pinLabels on transistor", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <transistor
        name="Q3"
        type="pnp"
        footprint="to92"
        pinLabels={{ pin1: "e", pin2: "b", pin3: "c" }}
      />
    </board>,
  )

  circuit.render()

  const q3 = circuit.selectOne("Transistor") as Transistor
  expect(q3).toBeDefined()
  expect(q3.emitter).toBe(q3.portMap.pin1)
  expect(q3.base).toBe(q3.portMap.pin2)
  expect(q3.collector).toBe(q3.portMap.pin3)
})
