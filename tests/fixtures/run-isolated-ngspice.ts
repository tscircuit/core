import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"

const engine = await createNgspiceSpiceEngine()
const result = await engine.simulate(await Bun.stdin.text())
console.log(JSON.stringify(result))
process.exit(0)
