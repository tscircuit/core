import { expect, test } from "bun:test"
import { checkPcbCourtyardOverKeepout } from "@tscircuit/checks"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("generated antenna exempts its own courtyard but rejects unrelated placements", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={42} height={18} schematicDisabled>
      <pcbnotetext text="GENERATED ANTENNA KEEPOUT" pcbY={7.5} fontSize={1} />
      <antenna
        name="ANT1"
        antennaShape="2.4ghz_quarter_wave_monopole"
        pcbX={-16}
      >
        <courtyardrect width={31} height={0.8} pcbX={15.5} />
      </antenna>
      <chip
        name="U1"
        pcbX={4}
        pcbY={3}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              shape="rect"
              width={0.6}
              height={0.6}
            />
            <courtyardrect width={2} height={2.9} pcbY={-0.5} />
          </footprint>
        }
      />
      <pcbnotetext
        text="ANT1: inferred exclusion - no error"
        pcbY={-3.5}
        fontSize={0.8}
      />
      <pcbnotetext
        text="U1: courtyard enters keepout - ERROR"
        pcbY={-5.5}
        fontSize={0.8}
      />
      <pcbnotetext
        text="U1 pad stays outside the keepout"
        pcbY={-7}
        fontSize={0.7}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const source = circuit.db.source_component.getWhere({ name: "ANT1" })!
  const antenna = circuit.db.pcb_component.getWhere({
    source_component_id: source.source_component_id,
  })!
  expect(
    circuit.db.pcb_keepout
      .list()
      .every((keepout) =>
        keepout.excluded_pcb_component_ids?.includes(antenna.pcb_component_id),
      ),
  ).toBeTrue()
  const errors = circuit.db.pcb_placement_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]?.message).toContain("Courtyard of U1")
  // Removing generated exclusions must expose the antenna's own intersections,
  // proving this test exercises the exemption rather than disjoint geometry.
  const withoutExclusions = circuit
    .getCircuitJson()
    .map((el) =>
      el.type === "pcb_keepout"
        ? { ...el, excluded_pcb_component_ids: [] }
        : el,
    )
  expect(
    checkPcbCourtyardOverKeepout(withoutExclusions).some((error) =>
      error.message.includes("Courtyard of ANT1"),
    ),
  ).toBeTrue()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1200,
    height: 650,
    showCourtyards: true,
  })
})
