import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const controllerPins = {
  pin3: "CS",
  pin5: "VCC",
  pin7: "SCK",
  pin8: "GND",
}

const peripheralPins = {
  pin2: "CS",
  pin4: "GND",
  pin6: "SCK",
  pin8: "VCC",
}

const prefabViaLocations = [-12, -6, 0, 6, 12].flatMap((x) =>
  [-4, 0, 4].map((y) => ({ x, y })),
)

const PrefabViaField = () => (
  <>
    {prefabViaLocations.map(({ x, y }, index) => (
      <via
        key={`PV${index}`}
        name={`PV${index + 1}`}
        fromLayer="top"
        toLayer="bottom"
        outerDiameter="0.42mm"
        holeDiameter="0.18mm"
        netIsAssignable={true}
        pcbX={x}
        pcbY={y}
      />
    ))}
  </>
)

test("repro130: missing junction", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="60mm"
      height="30mm"
      layers={2}
      autorouter="laser_prefab"
      autorouterEffortLevel="10x"
      defaultTraceWidth="0.1mm"
      minTraceWidth="0.08mm"
    >
      <chip
        name="U_CTRL"
        footprint="soic8"
        pinLabels={controllerPins}
        pcbX={-18}
        pcbY={0}
      />
      <chip
        name="U_RIGHT"
        footprint="soic8"
        pinLabels={peripheralPins}
        layer="bottom"
        pcbX={18}
        pcbY={0}
        pcbRotation={180}
      />

      <PrefabViaField />

      <trace from=".U_CTRL .VCC" to=".U_RIGHT .VCC" />
      <trace from=".U_CTRL .GND" to=".U_RIGHT .GND" />
      <trace from=".U_CTRL .CS" to=".U_RIGHT .CS" />
      <trace from=".U_CTRL .SCK" to=".U_RIGHT .SCK" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
