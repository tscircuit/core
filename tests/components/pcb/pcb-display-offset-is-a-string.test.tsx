import { expect, test } from "bun:test"
import * as CJ from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("display_offset_x/y are display strings, not raw numbers", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="40mm" routingDisabled>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX="3mm"
        pcbY="2mm"
      />
      <capacitor name="C1" capacitance="1uF" footprint="0402" pcbX={-8} />
      <group name="G1" pcbX={5} pcbY={3}>
        <led name="LED1" footprint="0603" pcbX={1} />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const byName: Record<
    string,
    { x: string | number | undefined; y: string | number | undefined }
  > = {}
  for (const element of circuitJson as any[]) {
    if (element.type !== "pcb_component" && element.type !== "pcb_group")
      continue
    byName[element.name ?? element.pcb_component_id] = {
      x: element.display_offset_x,
      y: element.display_offset_y,
    }
  }

  // circuit-json types these as `z.string()` ("how to display the offset ...
  // usually corresponding with how the user specified it"). They used to be
  // written as raw numbers, which fails schema validation, and
  // `circuit-to-svg`'s `formatOffsetLabel` silently ignores a non-string, so
  // the value never reached the rendered dimension label.
  for (const offsets of Object.values(byName)) {
    for (const value of Object.values(offsets)) {
      if (value === undefined) continue
      expect(typeof value).toBe("string")
    }
  }

  // A string the user supplied is preserved verbatim.
  expect(byName.G1?.x).toBe("5mm")

  // And every emitted pcb_component / pcb_group validates against its schema.
  for (const element of circuitJson as any[]) {
    const schema = (CJ as any)[element.type]
    if (!schema?.safeParse) continue
    if (element.type !== "pcb_component" && element.type !== "pcb_group")
      continue
    const result = schema.safeParse(element)
    const issues = result.success
      ? []
      : result.error.issues
          .filter((i: any) => String(i.path[0]).startsWith("display_offset"))
          .map((i: any) => `${i.path.join(".")}: ${i.message}`)
    expect({ type: element.type, issues }).toEqual({
      type: element.type,
      issues: [],
    })
  }
})
