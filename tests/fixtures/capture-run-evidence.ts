import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"

/** Capture observed output, separately from passing snapshot baselines. */
export async function captureRunEvidence(
  circuitJson: CircuitJson,
  detail: string,
  name = "observed",
) {
  const escape = (text: string) =>
    text.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  const pcb = convertCircuitJsonToPcbSvg(circuitJson, {
    width: 800,
    height: 400,
    backgroundColor: "white",
  }).replace("<svg ", '<svg y="90" ')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="800" height="500" fill="white"/><g fill="#222" font-family="sans-serif" font-size="17" text-anchor="middle"><text x="400" y="30">Core converts TSX circuits to PCB Circuit JSON.</text><text x="400" y="60">${escape(detail)}</text></g>${pcb}</svg>`
  if (process.env.EVIDENCE_DIR) {
    await Bun.write(`${process.env.EVIDENCE_DIR}/${name}.svg`, svg)
    await Bun.write(
      `${process.env.EVIDENCE_DIR}/${name}.json`,
      JSON.stringify(circuitJson),
    )
  }
  return svg
}
