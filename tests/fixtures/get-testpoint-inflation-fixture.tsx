import { getTestFixture } from "./get-test-fixture"

export const getTestPointInflationFixture = async () => {
  const { circuit: original } = getTestFixture()
  // Power-output probe from the AM3352 SBC's USB-C PD supply:
  // https://github.com/tscircuit/am3352-sbc/blob/bc85a52da8dcad023a3721ca9c90f7a9d29ea3d6/design/pd-power.tsx
  // nets.tsx expands Cap to an 0805 capacitor with pin1 on VIN_5V.
  // Extract only the VIN_5V probe connection; the capacitor's GND connection
  // and the rest of the power supply are outside this regression.
  // Keep the original names, values, pad size and 5 mm spacing; translate both
  // parts by (+35.5, +18) mm to center this excerpt on a small test board.
  // Route only this extracted circuit locally, then import its saved copper.
  original.add(
    <board width={14} height={8}>
      <capacitor
        name="C_PD_OUT"
        capacitance="10uF"
        footprint="0805"
        pcbX={-2.5}
      />
      <testpoint
        name="TP_5V"
        footprintVariant="pad"
        padDiameter={1.5}
        pcbX={2.5}
      />
      <trace from=".C_PD_OUT > .pin1" to="net.VIN_5V" />
      <trace from=".TP_5V > .pin1" to="net.VIN_5V" />
    </board>,
  )
  await original.renderUntilSettled()

  const { circuit: imported } = getTestFixture()
  let importError: Error | undefined
  try {
    imported.add(
      <board
        width={14}
        height={8}
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
