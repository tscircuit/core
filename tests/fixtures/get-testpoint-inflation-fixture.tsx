import { getTestFixture } from "./get-test-fixture"

export const getTestPointInflationFixture = async () => {
  const { circuit: original } = getTestFixture()
  original.add(
    <board width={24} height={16} routingDisabled>
      <group name="Probes" pcbX={2} pcbY={1} pcbRotation={90}>
        <testpoint
          name="TP_CIRCLE"
          displayName="Circular probe"
          footprintVariant="pad"
          padShape="circle"
          padDiameter={1.2}
          pcbX={-4}
          manufacturerPartNumber="PROBE-CIRCLE"
          supplierPartNumbers={{ mouser: ["PROBE-1"] }}
        />
        <testpoint
          name="TP_RECT"
          footprintVariant="pad"
          padShape="rect"
          width={1.5}
          height={2.5}
          pcbRotation={90}
          layer="bottom"
        />
        <testpoint
          name="TP_HOLE"
          footprintVariant="through_hole"
          holeDiameter={0.8}
          pcbX={4}
        />
        <trace from=".TP_CIRCLE > .pin1" to=".TP_RECT > .pin1" />
        <trace from=".TP_RECT > .pin1" to=".TP_HOLE > .pin1" />
      </group>
    </board>,
  )
  await original.renderUntilSettled()

  const { circuit: imported } = getTestFixture()
  let importError: Error | undefined
  try {
    imported.add(
      <board
        width={24}
        height={16}
        routingDisabled
        circuitJson={original.getCircuitJson()}
      />,
    )
    await imported.renderUntilSettled()
  } catch (error) {
    if (
      !(error instanceof Error) ||
      error.message !==
        'No inflator implemented for source component ftype: "simple_test_point"'
    ) {
      throw error
    }
    importError = error
  }

  return { original, imported, importError }
}
