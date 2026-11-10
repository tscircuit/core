import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { NoMeanderDifferentialPairBoard } from "./no-meander-differential-pair-board"

const circuit = new RootCircuit()
circuit.add(<NoMeanderDifferentialPairBoard routingDisabled />)
circuit.render()
const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
  db: circuit.db,
})
const autorouter = new TscircuitAutorouter(simpleRouteJson, {
  platformConfig: { autorouterThreads: 2 },
})
const failure = await new Promise((resolve, reject) => {
  autorouter.on("complete", () => reject(new Error("Expected routing to fail")))
  autorouter.on("error", (event) => resolve(event.failure))
  autorouter.start()
})
process.stdout.write(`PAIR_RESULT ${JSON.stringify(failure)}\n`)
