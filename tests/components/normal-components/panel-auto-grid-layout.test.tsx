import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel auto-calculates grid to fit boards within panel dimensions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel
      width="200mm"
      height="40mm"
      layoutMode="grid"
      edgePadding="5mm"
      boardGap="2mm"
    >
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
    </panel>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-wide")
})

test("panel auto-calculates grid for tall narrow panel", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel
      width="40mm"
      height="200mm"
      layoutMode="grid"
      edgePadding="5mm"
      boardGap="2mm"
    >
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
    </panel>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(`${import.meta.path}-tall`)
})

test("panel square grid", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel
      width="100mm"
      height="100mm"
      layoutMode="grid"
      edgePadding="5mm"
      boardGap="2mm"
    >
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
      <board width="20mm" height="20mm" routingDisabled />
    </panel>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(`${import.meta.path}-square-grid`)
})
