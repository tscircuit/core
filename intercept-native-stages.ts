import { join } from "node:path"
const router = await import(join(process.cwd(), "node_modules/@tscircuit/capacity-autorouter/dist/index.js"))
const patched = new Set<object>()
for (const [name, Constructor] of Object.entries(router)) {
  if (typeof Constructor !== "function") continue
  const prototype = Constructor.prototype
  if (!prototype?.getCurrentPhase || !prototype.step || patched.has(prototype)) continue
  patched.add(prototype)
  const step = prototype.step
  const previous = new WeakMap<object, string>()
  prototype.step = function (...args: unknown[]) {
    const result = step.apply(this, args)
    const phase = this.getCurrentPhase()
    if (previous.get(this) !== phase || this.solved || this.failed) {
      previous.set(this, phase)
      const children = Object.entries(this).flatMap(([key, child]: [string, any]) =>
        child?.timeSpentOnPhase ? [{name:key, iterations:child.iterations, phases:child.timeSpentOnPhase}] : [])
      console.log("UNCHANGED_PIPELINE_STAGE=" + JSON.stringify({name, phase, iterations:this.iterations, solved:this.solved, failed:this.failed, phases:this.timeSpentOnPhase, children}))
    }
    return result
  }
}
console.log("UNCHANGED_PIPELINE_INTERCEPT=" + JSON.stringify({patched:patched.size}))
