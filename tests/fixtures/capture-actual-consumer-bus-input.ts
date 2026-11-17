// TEMP diagnostic only. Exclude this module and selected test edits from the
// feature PR. These observers do not replace callbacks or stop real routing.
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { gzipSync } from "node:zlib"
import { isDeepStrictEqual } from "node:util"
import type { RootCircuit } from "lib/RootCircuit"
import type { AutoroutingStartEvent } from "lib/events"

const sha256 = (bytes: string | Buffer) =>
  createHash("sha256").update(bytes).digest("hex")
const maximumBytes = 1024 * 1024
const marker = "CORE_CONSUMER_ACTUAL_INPUT_V1"
const expectedAdapterSha256 = "805b43c4d2fce98b899e313cee9d522fbdfa33526573a5cf91c22765383b03bc"

/** Capture genuine constructed bus parameters in board-world mm, +X right,
 * +Y up and +Z above, without mutating the input or short-circuiting a phase.
 */
export function captureActualConsumerBusInput(
  circuit: RootCircuit,
  sample: string,
) {
  let phaseName: AutoroutingStartEvent["phaseName"]
  let phaseInput: AutoroutingStartEvent["simpleRouteJson"] | undefined
  let ordinal = 0
  circuit.on("autorouting:start", (event) => {
    phaseName = event.phaseName
    phaseInput = structuredClone(event.simpleRouteJson)
  })
  circuit.on("solver:started", (event) => {
    if (event.solverName !== "BusLanesPipelineSolver") return
    try {
      const adapterSha256 = sha256(readFileSync("lib/utils/autorouting/BusLanesAutorouter.ts"))
      if (adapterSha256 !== expectedAdapterSha256)
        throw new Error("Actual-constructor adapter source differs from the reviewed checkpoint")
      const packageDirectory = resolve(
        "node_modules/@tscircuit/bus-lanes-solver",
      )
      const packageBytes = readFileSync(resolve(packageDirectory, "package.json"))
      const installed: {
        version: string
        main?: string
        module?: string
        exports?: { "."?: { import?: string } }
      } = JSON.parse(packageBytes.toString("utf8"))
      const executable = installed.exports?.["."]?.import ?? installed.module ?? installed.main
      if (!executable) throw new Error("Missing solver executable")
      const record = {
        schemaVersion: 1,
        adapterSha256,
        sample,
        ordinal: ordinal++,
        phaseName,
        solverName: event.solverName,
        constructorInputMatches: isDeepStrictEqual(
          event.solverConstructorArgs[0],
          event.solverParams,
        ),
        declaredSolver: JSON.parse(readFileSync("package.json", "utf8"))
          .devDependencies["@tscircuit/bus-lanes-solver"],
        installedVersion: installed.version,
        installedPackageSha256: sha256(packageBytes),
        installedExecutable: executable,
        installedExecutableSha256: sha256(readFileSync(resolve(packageDirectory, executable))),
        phaseInput,
        solverInput: structuredClone(event.solverParams),
        qualification: "Observed real constructed solver input; not accepted output or a future-route witness",
      }
      const raw = Buffer.from(JSON.stringify(record, (_name, value) => {
        if (typeof value === "number" && !Number.isFinite(value))
          throw new Error("Non-finite input cannot use JSON capture")
        return value
      }))
      if (raw.length > maximumBytes) throw new Error("Input exceeds capture size")
      const compressed = gzipSync(raw, { level: 9 })
      const encoded = compressed.toString("base64")
      if (encoded.length > maximumBytes) throw new Error("Capture exceeds output size")
      const header = {
        sample,
        ordinal: record.ordinal,
        phaseName,
        encoding: "gzip+base64",
        rawBytes: raw.length,
        rawSha256: sha256(raw),
        gzipBytes: compressed.length,
        gzipSha256: sha256(compressed),
        base64Characters: encoded.length,
        chunks: Math.ceil(encoded.length / 12288),
      }
      const lines = [marker + "_BEGIN " + JSON.stringify(header)]
      for (let start = 0, chunk = 0; start < encoded.length; start += 12288, chunk++)
        lines.push(marker + "_CHUNK " + JSON.stringify({
          sample, ordinal: record.ordinal, chunk,
          base64: encoded.slice(start, start + 12288),
        }))
      lines.push(marker + "_END " + JSON.stringify(header))
      console.log(lines.join("\n"))
    } catch {
      // Capture failures remain explicit, and never alter the real routing
      // error, test assertions or pipeline progression.
      console.log(marker + "_ERROR " + JSON.stringify({ sample, phaseName }))
    }
  })
}
