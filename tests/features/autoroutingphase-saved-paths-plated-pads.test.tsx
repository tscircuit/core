import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("saved phase paths accept plated pad layers at endpoints", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={14} height={10} routeRemaining={false}>
      <pinheader name="J1" pinCount={1} pcbX={-4} />
      <pinheader name="J2" pinCount={1} pcbX={4} />
      <trace from="J1.pin1" to="J2.pin1" />
      <autoroutingphase
        phaseIndex={0}
        connection="J1.pin1"
        pcbTracePaths={[
          {
            connection: "J1.pin1",
            route: [
              { route_type: "wire", x: -4, y: 0, width: 0.25, layer: "bottom" },
              { route_type: "wire", x: 4, y: 0, width: 0.25, layer: "bottom" },
            ],
          },
        ]}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.pcb_autorouting_error
      .list()
      .map((error) => error.message)
      .join("\n"),
  ).toBe("")
  const [trace] = circuit.db.pcb_trace.list()
  expect(
    trace?.route.filter((p) => p.route_type === "wire").map((p) => p.layer),
  ).toEqual(["bottom", "bottom"])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
