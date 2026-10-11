import { RootCircuit, type Port, type Group } from "lib"
import { Resvg } from "@resvg/resvg-js"
import { join } from "node:path"

// Observed-run evidence, never an expected snapshot baseline.
const label = process.argv[2] ?? "failure"
const circuit = new RootCircuit({ platform: { pcbDisabled: true } })
circuit.add(
  <board width={10} height={10} routingDisabled schematicDisabled>
    <chip
      name="Q_PD_INHIBIT"
      symbol={
        <symbol>
          <port name="pin2" pinNumber={2} />
        </symbol>
      }
    />
  </board>,
)
await circuit.renderUntilSettled()
const [port] = (circuit.firstChild as Group).selectAll<Port>("port")
const selector = port!.getPortSelector()
const matches = circuit.selectAll(selector)
const roundTrip = circuit.selectOne(selector, { type: "port" }) === port
const result = {
  coreVersion: circuit.getCoreVersion(),
  owner: port!.getParentNormalComponent()!.props.name,
  parent: port!.parent!.componentName,
  port: port!.props.name,
  selector,
  matchCount: matches.length,
  roundTrip,
  shortSelectorRoundTrip:
    circuit.selectOne("Q_PD_INHIBIT.pin2", { type: "port" }) === port,
}
const color = roundTrip && matches.length === 1 ? "#15803d" : "#b91c1c"
const escape = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="520" viewBox="0 0 960 520">
<rect width="960" height="520" fill="white"/>
<g font-family="Arial, sans-serif" text-anchor="middle" fill="#172033">
<text x="480" y="38" font-size="18">tscircuit/core converts React circuit elements to Circuit JSON.</text>
<text x="480" y="67" font-size="16" fill="${color}">${roundTrip ? "PASS: the generated selector resolves the original symbol port." : "FAIL: the generated selector skips the port’s Symbol parent and matches nothing."}</text>
<rect x="310" y="110" width="340" height="65" rx="8" fill="#f8fafc" stroke="#64748b"/>
<text x="480" y="150" font-size="22">Chip: ${escape(String(result.owner))}</text>
<path d="M480 175V207 M480 272V307" stroke="#64748b" stroke-width="2"/>
<rect x="360" y="207" width="240" height="65" rx="8" fill="#f8fafc" stroke="#64748b"/>
<text x="480" y="247" font-size="22">${escape(result.parent)}</text>
<rect x="360" y="307" width="240" height="65" rx="8" fill="#f8fafc" stroke="#64748b"/>
<text x="480" y="347" font-size="22">Port: ${escape(String(result.port))}</text>
<text x="480" y="417" font-size="21" font-family="monospace">${escape(selector)}</text>
<text x="480" y="452" font-size="19" fill="${color}">Matches: ${matches.length} · Same original port: ${roundTrip ? "yes" : "no"}</text>
<text x="480" y="487" font-size="14" fill="#64748b">Actual Bun ${Bun.version} run · core ${result.coreVersion} · no routing</text>
</g></svg>\n`
const directory = import.meta.dir
await Bun.write(
  join(directory, `${label}.json`),
  JSON.stringify(result, null, 2) + "\n",
)
await Bun.write(join(directory, `${label}.svg`), svg)
await Bun.write(
  join(directory, `${label}.png`),
  new Resvg(svg).render().asPng(),
)
console.log(JSON.stringify(result, null, 2))
