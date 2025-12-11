import { RootCircuit } from "lib"

export const renderToCircuitJson = async (tsx: any) => {
  const circuit = new RootCircuit()
  circuit.add(tsx)
  await circuit.renderUntilSettled()
  return circuit.getCircuitJson()
}
