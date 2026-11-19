import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { gzipSync, gunzipSync } from "node:zlib"
import { NativeDdrBoard } from "@tscircuit/core-ddr-benchmark/circuits/native-ddr-board"
import { RootCircuit } from "./index"
const out = process.env.CAPTURE_DIRECTORY!
mkdirSync(out, { recursive: true })
const benchmark = new URL("./node_modules/@tscircuit/core-ddr-benchmark/circuits/a64.json.gz", import.meta.url)
const source = JSON.parse(gunzipSync(readFileSync(benchmark)).toString())
const circuit = new RootCircuit()
circuit.on("autorouting:start", (event) => {
  console.log("PHASE",event.phaseName,event.simpleRouteJson.connections.length,event.simpleRouteJson.traces?.length,event.simpleRouteJson.obstacles.length)
  if (event.phaseName !== "remaining") return
  writeFileSync(out + "/remaining.srj.json.gz", gzipSync(JSON.stringify(event.simpleRouteJson)))
  writeFileSync(out + "/circuit.json.gz", gzipSync(JSON.stringify(circuit.getCircuitJson())))
  process.exit(0)
})
circuit.on("autorouting:error", (event) => { console.error(event.error); process.exit(1) })
circuit.add(<NativeDdrBoard source={source} />)
await circuit.renderUntilSettled()
throw new Error("Did not reach A64 remaining phase")
