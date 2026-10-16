import type { PartsEngine } from "@tscircuit/props"
import { getTestFixture } from "./get-test-fixture"

export const getMatching0603PartsEngine = async (): Promise<PartsEngine> => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={8} height={6} routingDisabled>
      <capacitor name="C_SUPPLIER" capacitance="100nF" footprint="0603" />
    </board>,
  )
  await circuit.renderUntilSettled()

  return {
    findPart: async () => ({ jlcpcb: ["C14663"] }),
    fetchPartCircuitJson: async () => circuit.getCircuitJson(),
  }
}
