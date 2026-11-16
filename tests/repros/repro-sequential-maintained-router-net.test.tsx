import { expect, it } from "bun:test"
import {
  checkEachPcbPortConnectedToPcbTraces,
  checkTracesAreContiguous,
} from "@tscircuit/checks"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { SequentialMaintainedRouterNet } from "tests/fixtures/sequential-maintained-router-net"

it("maintained router connects separate sequential net islands", async () => {
  const { project } = getTestFixture({
    platform: { allowLegacyAutorouters: true },
  })

  project.add(<SequentialMaintainedRouterNet />)

  await project.renderUntilSettled()

  expect(
    project.getCircuitJson().filter((r) => r.type.endsWith("_error")),
  ).toEqual([])
  expect(
    checkEachPcbPortConnectedToPcbTraces(project.getCircuitJson()),
  ).toEqual([])
  expect(checkTracesAreContiguous(project.getCircuitJson())).toEqual([])
  const pcbTraces = project.db.pcb_trace.list()

  expect(pcbTraces.length).toBeGreaterThanOrEqual(3)

  expect(project.getCircuitJson()).toMatchPcbSnapshot(import.meta.path, {
    diffThresholdPercent: 2,
  })
})
