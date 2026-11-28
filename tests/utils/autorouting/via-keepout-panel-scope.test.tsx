import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("inter-board routing inherits via keepouts from the active subpanel only", async () => {
  const { circuit } = getTestFixture()
  const routingInputs: SimpleRouteJson[] = []
  circuit.on("autorouting:start", ({ simpleRouteJson }) =>
    routingInputs.push(simpleRouteJson),
  )

  circuit.add(
    <panel width={60} height={30} panelizationMethod="none">
      <subpanel
        name="routed"
        layoutMode="grid"
        col={2}
        pcbX={-10}
        panelizationMethod="none"
      >
        <board name="B1" width={10} height={10}>
          <resistor name="R1" resistance="1k" footprint="0805" />
          <keepout
            shape="circle"
            radius={1.25}
            pcbY={3}
            allowPlacements
            allowTraces
          />
          <keepout shape="rect" width={3} height={4} pcbY={-3} allowPlacements />
        </board>
        <board name="B2" width={10} height={10}>
          <resistor name="R2" resistance="1k" footprint="0805" />
        </board>
        <trace from=".B1 .R1 .pin2" to=".B2 .R2 .pin1" />
      </subpanel>
      <subpanel name="separate" pcbX={19} panelizationMethod="none">
        <board name="B3" width={10} height={10}>
          <keepout shape="circle" radius={2.75} allowTraces />
        </board>
      </subpanel>
    </panel>,
  )
  await circuit.renderUntilSettled()

  const keepouts = circuit.db.pcb_keepout.list()
  const inScope = keepouts
    .filter((keepout) => keepout.shape === "circle")
    .find((keepout) => keepout.radius === 1.25)!
  const traceKeepout = keepouts.find((keepout) => keepout.shape === "rect")!
  expect(keepouts).toHaveLength(3)
  expect(routingInputs).toHaveLength(1)
  expect(routingInputs[0]!.obstacles).toContainEqual(
    expect.objectContaining({
      center: traceKeepout.center,
      width: 3,
      height: 4,
    }),
  )
  expect(routingInputs[0]!.obstacles).not.toContainEqual(
    expect.objectContaining({
      center: inScope.center,
      width: 2.5,
      height: 2.5,
    }),
  )
  expect(routingInputs[0]!.viaKeepouts).toEqual([
    { shape: "circle", center: inScope.center, radius: 1.25, layers: ["top"] },
  ])
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
})
