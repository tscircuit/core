import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("matchpack: explicit schRotation on solderjumper is never overridden by matchpack group", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <group schRotation={90}>
        <solderjumper name="SJ3" schRotation={180} />
        <chip name="U3" />
      </group>
    </board>,
  )
  await circuit.render()
  const schematic = circuit
    .getCircuitJson()
    .filter(
      (el: any) =>
        el.type === "schematic_component" && typeof el.symbol_name === "string",
    ) as { symbol_name: string }[]
  const sj = schematic.find((el: any) =>
    el.symbol_name.includes("solderjumper"),
  )
  // Debug: print actual symbol_name value
  // eslint-disable-next-line no-console
  console.log("sj.symbol_name:", sj?.symbol_name)
  // For schRotation=180, symbol_name should end with _down (codebase mapping)
  expect(sj ? /_left$/.test(sj.symbol_name) : false).toBe(true)
})

/**
 * Test: Solderjumpers and chips should inherit matchpack schematic rotation unless schRotation is set
 */
test("matchpack: solderjumper inside matchpack group with multiple children inherits group schematic rotation by default", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <group schRotation={90}>
        <solderjumper name="SJ1" />
        <chip name="U1" />
      </group>
    </board>,
  )
  await circuit.render()
  const schematic = circuit
    .getCircuitJson()
    .filter(
      (el: any) =>
        el.type === "schematic_component" && typeof el.symbol_name === "string",
    ) as { symbol_name: string }[]
  const sj = schematic.find((el: any) =>
    el.symbol_name.includes("solderjumper"),
  )
  // Debug: print actual symbol_name value
  // eslint-disable-next-line no-console
  console.log("sj.symbol_name:", sj?.symbol_name)
  // For schRotation=90, symbol_name should end with _right (codebase mapping)
  expect(sj ? /_right$/.test(sj.symbol_name) : false).toBe(true)
})

test("matchpack: solderjumper schRotation is respected and not overridden by matchpack group with multiple children", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <group schRotation={90}>
        <solderjumper name="SJ2" schRotation={270} />
        <chip name="U2" />
      </group>
    </board>,
  )
  await circuit.render()
  const schematic = circuit
    .getCircuitJson()
    .filter(
      (el: any) =>
        el.type === "schematic_component" && typeof el.symbol_name === "string",
    ) as { symbol_name: string }[]
  const sj = schematic.find((el: any) =>
    el.symbol_name.includes("solderjumper"),
  )
  // Debug: print actual symbol_name value
  // eslint-disable-next-line no-console
  console.log("sj.symbol_name:", sj?.symbol_name)
  // For schRotation=270, symbol_name should end with _down (codebase mapping)
  expect(sj ? /_down$/.test(sj.symbol_name) : false).toBe(true)
})
