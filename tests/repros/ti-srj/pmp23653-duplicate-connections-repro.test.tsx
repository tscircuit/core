import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const getPinSelectors = (componentName: string) =>
  Array.from(
    { length: 6 },
    (_, pinIndex) => `.${componentName} > .pin${pinIndex + 1}`,
  )

test("PMP23653 TSX topology emits each net twice to the autorouter", async () => {
  const { circuit } = getTestFixture({
    platform: { schematicDisabled: true },
  })
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board
      name="PMP23653_PLANAR_TRANSFORMER"
      width="42mm"
      height="26mm"
      autorouter="default"
    >
      <pinheader
        name="J5"
        pinCount={6}
        pcbX={-10}
        pcbY={4}
        showSilkscreenPinLabels
      />
      <pinheader
        name="J7"
        pinCount={6}
        pcbX={-10}
        pcbY={-4}
        showSilkscreenPinLabels
      />
      <pinheader
        name="J3"
        pinCount={6}
        pcbX={10}
        pcbY={0}
        showSilkscreenPinLabels
      />

      <net name="SECONDARY" />
      <net name="PRIMARY" />
      <trace
        path={[
          ...getPinSelectors("J5"),
          ...getPinSelectors("J7"),
          "net.SECONDARY",
        ]}
      />
      <trace path={[...getPinSelectors("J3"), "net.PRIMARY"]} />

      <pcbnotetext
        text="PMP23653 PLANAR TRANSFORMER CONNECTOR TOPOLOGY"
        pcbY={11}
        fontSize={0.8}
        color="#f8fafc"
      />
      <pcbnotetext
        text="SECONDARY: J5 + J7 (12 terminals)    PRIMARY: J3 (6 terminals)"
        pcbY={8.8}
        fontSize={0.65}
        color="#93c5fd"
      />
      <pcbnotetext
        text="DEFAULT AUTOROUTER: 4 INPUT JOBS -> 16 ROUTED SEGMENTS"
        pcbY={-9.5}
        fontSize={0.64}
        color="#ef4444"
      />
      <pcbnotetext
        text="BUG: SOLVER MERGES 2 DUPLICATES; PCB VIEW HIDES BAD INPUT"
        pcbY={-11.2}
        fontSize={0.64}
        color="#ef4444"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const autorouterInput = autoroutingPhaseIoStack[0]?.startSimpleRouteJson
  const autorouterOutput = autoroutingPhaseIoStack[0]?.endSimpleRouteJson

  expect(circuit.db.source_net.list()).toHaveLength(2)
  expect(autorouterInput?.connections).toHaveLength(4)
  expect(
    autorouterInput?.connections.reduce(
      (endpointCount, connection) =>
        endpointCount + connection.pointsToConnect.length,
      0,
    ),
  ).toBe(36)
  expect(autorouterOutput?.traces).toHaveLength(16)
  await expect(autoroutingPhaseIoStack).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "pmp23653-default-autorouter-duplicate-routing",
    circuit,
  )
})
