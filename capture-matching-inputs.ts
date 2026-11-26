import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { createHash } from "node:crypto"
const bus = await import(join(process.cwd(), "node_modules/@tscircuit/bus-lanes-solver/dist/index.js"))
const seen = new WeakSet<object>()
const inputs = new Set<string>()
const directory = process.env.DDR_CAPTURE_DIR!
mkdirSync(directory, {recursive:true})
const step = bus.BusLanesPipelineSolver.prototype.step
bus.BusLanesPipelineSolver.prototype.step = function (...args: unknown[]) {
  if (!seen.has(this)) {
    seen.add(this)
    const input = this.input
    if (input.buses?.some(b => b.minLength !== undefined || b.maxLength !== undefined || b.maxLengthSkew !== undefined)) {
      const key = JSON.stringify([input.connections.map(c=>c.name), input.buses.map(b=>b.busId)])
      if (!inputs.has(key) && inputs.size < 12) {
        inputs.add(key)
        const json = JSON.stringify(input)
        const name = `phase-${inputs.size}-${input.connections.length}`
        writeFileSync(join(directory, name+".json.gz"), Bun.gzipSync(json))
        console.log("MATCHING_INPUT="+JSON.stringify({name,sha256:createHash("sha256").update(json).digest("hex"),connections:input.connections.length,fixed:input.traces?.length??0,buses:input.buses.map(b=>({name:b.busId,min:b.minLength,skew:b.maxLengthSkew}))}))
      }
    }
  }
  return step.apply(this,args)
}
