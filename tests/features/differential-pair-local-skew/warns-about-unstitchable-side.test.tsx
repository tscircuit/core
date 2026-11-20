import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a pair whose side cannot be stitched pin to pin gets a warning instead of local skew", () => {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(
    <board routeRemaining={false} width="30mm" height="12mm">
      <testpoint
        name="TP_SRC"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={-12}
        pcbY={0.3}
      />
      <testpoint
        name="TN_SRC"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={-12}
        pcbY={-0.3}
      />
      <testpoint
        name="TP_LOAD"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={12}
        pcbY={0.3}
      />
      <testpoint
        name="TN_LOAD"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={12}
        pcbY={-0.3}
      />
      <trace
        name="DP"
        from=".TP_SRC > .pin1"
        to=".TP_LOAD > .pin1"
        thickness="0.15mm"
        pcbPathRelativeTo=".TP_SRC > .pin1"
        pcbPaths={[
          [".TP_SRC > .pin1", { x: 8, y: 0 }],
          [{ x: 9, y: 0 }, ".TP_LOAD > .pin1"],
        ]}
      />
      <trace
        name="DN"
        from=".TN_SRC > .pin1"
        to=".TN_LOAD > .pin1"
        thickness="0.15mm"
        pcbPath={[]}
      />
      <differentialpair
        name="USB"
        positiveConnection="DP"
        negativeConnection="DN"
        pcbTraceGap="0.45mm"
      />
      <pcbnotetext
        pcbY={4}
        fontSize={0.5}
        text="DP is two PCB traces with a 1 mm gap at x = -4"
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  expect(circuit.db.pcb_differential_pair_local_skew.list()).toEqual([])
  expect(
    circuit.db.pcb_bus_routing_constraint_warning
      .list()
      .map(({ routing_rule, message }) => ({ routing_rule, message })),
  ).toEqual([
    {
      routing_rule: "route_geometry",
      message:
        'Local skew was not computed for differential pair "USB": the PCB traces of DP do not join its two pins',
    },
  ])
})
