import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a synchronously throwing check group does not prevent later groups from running", async () => {
  const { circuit } = getTestFixture({
    platform: {
      fabricatorEngine: {
        runDrcChecks() {
          throw new Error(
            "Fabricator checker crashed before returning a promise",
          )
        },
      },
    },
  })
  circuit.add(
    <board
      width={12}
      height={8}
      fabricatorPreset="jlcpcb_economy"
      routingDisabled
    >
      <resistor name="R1" resistance="1k" footprint="0402" />
      <drccheck
        name="later-check"
        checkFn={() => ({
          message: "Later check ran",
          source_component_ids: [],
          source_port_ids: [],
        })}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.source_runtime_error.list()).toMatchObject([
    {
      phase_name: "PcbDesignRuleChecks",
      message:
        "DRC could not complete (fabricator): Fabricator checker crashed before returning a promise",
    },
  ])
  expect(circuit.db.source_component_misconfigured_error.list()).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ message: "Later check ran" }),
    ]),
  )
  expect(circuit.db.pcb_component.list()).toHaveLength(1)
})
