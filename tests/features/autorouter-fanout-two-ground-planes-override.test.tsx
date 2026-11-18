import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an explicit GND-plane override remains authoritative for a backside decoupler", async () => {
  const { circuit } = getTestFixture()
  const phases = createAutoroutingPhaseIoStack(circuit)
  circuit.add(
    <board
      width={12}
      height={7}
      layers={6}
      schematicDisabled
      minTraceWidth={0.1}
      minViaHoleDiameter={0.2}
      minViaPadDiameter={0.45}
    >
      <autoroutingphase
        autorouter="fanout"
        fanoutPourNetMap={{ inner1: "net.GND" }}
      />
      <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX={-2} />
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="0402"
        pcbX={2}
        layer="bottom"
      />
      <trace name="C1_GND" from=".C1 > .pin2" to="net.GND" />
      <trace name="C2_GND" from=".C2 > .pin2" to="net.GND" />
      <copperpour connectsTo="net.GND" layer="inner1" unbroken />
      <copperpour connectsTo="net.GND" layer="inner4" unbroken />
      <pcbnotetext
        pcbY={2.5}
        text="Explicit GND override: inner1 only"
        fontSize={0.45}
      />
      <pcbnotetext
        pcbX={-2}
        pcbY={-2}
        text="C1 top to inner1"
        fontSize={0.35}
      />
      <pcbnotetext
        pcbX={2}
        pcbY={-2}
        text="C2 bottom to inner1"
        fontSize={0.35}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(phases[0]?.startSimpleRouteJson?.buses).toEqual([
    expect.objectContaining({
      busId: "C1_GND",
      termination: { type: "plane", layer: "inner1" },
    }),
    expect.objectContaining({
      busId: "C2_GND",
      termination: { type: "plane", layer: "inner1" },
    }),
  ])
  expect(circuit.db.pcb_via.list()).toEqual([
    expect.objectContaining({ from_layer: "top", to_layer: "inner1" }),
    expect.objectContaining({ from_layer: "bottom", to_layer: "inner1" }),
  ])
  expect(
    circuit.db.pcb_copper_pour
      .list()
      .map((pour) => pour.layer)
      .sort(),
  ).toEqual(["inner1", "inner4"])
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: false,
    showPinNumbers: true,
  })
})
