import { expect, test } from "bun:test"
import * as CJ from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("groups do not emit null anchor_alignment / subcircuit_id", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm" routingDisabled>
      <group name="G1" pcbX={4}>
        <resistor name="R1" resistance="1k" footprint="0402" />
      </group>
      <group name="G2" pcbX={-6} pcbAnchorAlignment="top_left">
        <resistor name="R2" resistance="1k" footprint="0402" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const pcbGroups = circuitJson.filter(
    (e: any) => e.type === "pcb_group",
  ) as any[]
  const schematicGroups = circuitJson.filter(
    (e: any) => e.type === "schematic_group",
  ) as any[]

  expect(pcbGroups.length).toBeGreaterThan(0)
  expect(schematicGroups.length).toBeGreaterThan(0)

  // `anchor_alignment` is `ninePointAnchor.default("center")` — `null` fails
  // validation, while omitting it lets the schema default apply.
  for (const group of pcbGroups) {
    expect(group.anchor_alignment).not.toBeNull()
  }

  // `subcircuit_id` is `z.string().optional()`, so `null` is rejected.
  for (const group of schematicGroups) {
    expect(group.subcircuit_id).not.toBeNull()
  }

  // An explicitly requested alignment must still survive.
  const explicit = pcbGroups.find((g) => g.anchor_alignment === "top_left")
  expect(explicit).toBeDefined()

  // And these two fields must no longer be the reason validation fails.
  for (const group of [...pcbGroups, ...schematicGroups]) {
    const schema = (CJ as any)[group.type]
    const result = schema.safeParse(group)
    const relevantIssues = result.success
      ? []
      : result.error.issues
          .filter((i: any) =>
            ["anchor_alignment", "subcircuit_id"].includes(String(i.path[0])),
          )
          .map((i: any) => `${i.path.join(".")}: ${i.message}`)
    expect({ type: group.type, relevantIssues }).toEqual({
      type: group.type,
      relevantIssues: [],
    })
  }
})
