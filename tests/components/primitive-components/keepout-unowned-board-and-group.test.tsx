import {
  checkPcbCopperOverKeepout,
  checkPcbCourtyardOverKeepout,
} from "@tscircuit/checks"
import { expect, test } from "bun:test"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board and group keepouts have no implicit component exemption", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={10} schematicDisabled autorouter="none">
      <keepout
        pcbX={-7}
        shape="rect"
        width={2}
        height={2}
        allowTraces={false}
        allowPlacements={false}
      />
      <group name="G1" pcbX={7}>
        <keepout
          shape="circle"
          radius={1}
          allowTraces={false}
          allowPlacements={false}
        />
      </group>
      {[-7, 7].map((pcbX, column) => (
        <chip
          cadModel={null}
          key={pcbX}
          name={`FOREIGN${column}`}
          pcbX={pcbX}
          pinLabels={{ pin1: "SIGNAL" }}
          footprint={
            <footprint>
              <smtpad shape="rect" width={0.3} height={0.3} portHints={["1"]} />
              <courtyardrect width={0.5} height={0.5} />
            </footprint>
          }
        />
      ))}
      <pcbnotetext
        pcbX={-7}
        pcbY={-3}
        fontSize={0.6}
        text="Board keepout: no owner exemption"
      />
      <pcbnotetext
        pcbX={7}
        pcbY={-3}
        fontSize={0.6}
        text="Group keepout: no owner exemption"
      />
      <pcbnotetext
        pcbY={3}
        fontSize={0.6}
        text="Foreign copper/courtyard remains forbidden"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const keepouts = circuit.db.pcb_keepout.list()
  expect(keepouts).toHaveLength(2)
  for (const keepout of keepouts)
    expect(keepout.excluded_pcb_component_ids).toBeUndefined()
  const soup = circuit.getCircuitJson()
  for (const findings of [
    checkPcbCopperOverKeepout(soup),
    checkPcbCourtyardOverKeepout(soup),
  ]) {
    expect(findings).toHaveLength(2)
    expect(
      findings.every((finding) => finding.type === "pcb_placement_error"),
    ).toBe(true)
  }
  const obstacles = getObstaclesFromCircuitJson(keepouts)
  expect(obstacles).toHaveLength(2)
  expect(obstacles.every((obstacle) => obstacle.connectedTo.length === 0)).toBe(
    true,
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
  })
})
