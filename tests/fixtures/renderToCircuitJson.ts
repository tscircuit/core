import { RootCircuit } from "lib"

export const renderToCircuitJson = async (tsx: any) => {
  const circuit = new RootCircuit()
  circuit.add(tsx)
  circuit.render()
  return circuit.getCircuitJson()
}
