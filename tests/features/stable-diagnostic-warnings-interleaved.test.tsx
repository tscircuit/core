import { expect, test } from "bun:test"
import { Board, type PrimitiveComponent, Resistor, Trace } from "lib"
import { cssSelectPrimitiveComponentAdapter } from "lib/components/base-components/PrimitiveComponent/cssSelectPrimitiveComponentAdapter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Subtracting a circuit's first runtime ID still depends on interleaved work.
test("interleaved circuits have stable diagnostics and distinct runtime identity", () => {
  const { circuit: firstCircuit } = getTestFixture()
  const { circuit: secondCircuit } = getTestFixture()
  const firstBoard = new Board({ width: 20, height: 20, routingDisabled: true })
  const secondBoard = new Board({
    width: 20,
    height: 20,
    routingDisabled: true,
  })
  firstCircuit.add(firstBoard)
  secondCircuit.add(secondBoard)

  firstBoard.add(
    new Resistor({ name: "R1", resistance: "10k", footprint: "0402" }),
  )
  firstBoard.add(
    new Resistor({ name: "R2", resistance: "10k", footprint: "0402" }),
  )
  secondBoard.add(
    new Resistor({ name: "R1", resistance: "10k", footprint: "0402" }),
  )
  const firstTrace = new Trace({ from: ".R1 > .pin1", to: ".R2 > .pin1" })
  firstBoard.add(firstTrace)
  secondBoard.add(
    new Resistor({ name: "R2", resistance: "10k", footprint: "0402" }),
  )
  const secondTrace = new Trace({ from: ".R1 > .pin1", to: ".R2 > .pin1" })
  secondBoard.add(secondTrace)

  const runtimeIds = [firstTrace._renderId, secondTrace._renderId]
  const lifecycleDisplayNames: string[] = []
  firstCircuit.on("renderable:renderLifecycle:anyEvent", (event) => {
    lifecycleDisplayNames.push(event.componentDisplayName)
  })
  firstCircuit.render()
  secondCircuit.render()

  const firstWarnings = firstCircuit.db.source_unnamed_trace_warning.list()
  const secondWarnings = secondCircuit.db.source_unnamed_trace_warning.list()
  expect(firstWarnings).toHaveLength(1)
  expect(secondWarnings).toHaveLength(1)
  expect(lifecycleDisplayNames).toContain(firstTrace.getString())
  expect(firstWarnings[0].message).toBe(secondWarnings[0].message)
  expect(firstTrace.getString()).toContain("from:.R1 > .pin1 to:.R2 > .pin1")
  expect([firstTrace._renderId, secondTrace._renderId]).toEqual(runtimeIds)
  expect(firstTrace._renderId).not.toBe(secondTrace._renderId)
  expect(
    cssSelectPrimitiveComponentAdapter!.equals!(firstTrace, secondTrace),
  ).toBe(false)
  expect(firstCircuit.selectOne("trace")).toBe(firstTrace)
  expect(secondCircuit.selectOne("trace")).toBe(secondTrace)

  const firstResistor = firstCircuit.selectOne(".R1")!
  const secondResistor = secondCircuit.selectOne(".R1")!
  // Read matching children in opposite orders: diagnostic reads must not allocate IDs.
  const secondChildNames = [...secondResistor.children]
    .reverse()
    .map((child) => child.getString())
    .reverse()
  expect(firstResistor.children.map((child) => child.getString())).toEqual(
    secondChildNames,
  )
  expect(firstResistor.getString()).toBe(secondResistor.getString())
  expect(firstResistor.getString()).toContain('name=".R1"')
  expect(firstResistor.selectOne(".pin1")!.getString()).toContain(
    "pin:1 .R1>.pin1",
  )
  expect(firstResistor.selectOne("smtpad")!.getString()).toContain("(.1")
  expect(firstBoard.getString()).toMatch(/^<board#\d+(?:\.\d+)* \/>$/)

  const getDisplayTree = (component: PrimitiveComponent): string[] => [
    component.getString(),
    ...component.children.flatMap(getDisplayTree),
  ]
  expect(getDisplayTree(firstBoard)).toEqual(getDisplayTree(secondBoard))
})
