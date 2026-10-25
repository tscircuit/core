/** Measured geometry is emitted PCB-world points in mm: +X right, +Y up, +Z above, right handed. No transform or copper modification is performed. */
import { createHash } from "node:crypto"
import { writeFileSync } from "node:fs"
import { getCustomCachedFollowupFixture } from "../tests/fixtures/get-custom-cached-followup-fixture"
const reports = []
for (const mode of ["normal", "failed_followup", "native_control"] as const) {
  const times: number[] = []
  let record: any
  for (let trial = 0; trial < 6; trial++) {
    const fixture = getCustomCachedFollowupFixture(mode === "failed_followup"),
      at = performance.now(),
      first = await fixture.render(mode === "native_control"),
      second = await fixture.render(mode === "native_control")
    if (trial) times.push(performance.now() - at)
    const input = first.starts[0]!.simpleRouteJson!,
      wires = second.rows.flatMap((row) =>
        row.type === "pcb_trace"
          ? row.route.filter((point) => point.route_type === "wire")
          : [],
      ),
      endpoints = input.connections[0]!.pointsToConnect
    const nativeCopper = second.rows.filter(
        (row) => row.type === "pcb_trace" || row.type === "pcb_via",
      ),
      errors = (rows: typeof second.rows) =>
        rows.filter((row) => row.type.endsWith("_error")).length
    const prefix = second.circuit.db.pcb_trace.get("custom_prefix"),
      geometry = (route: any[]) =>
        route.map((point) =>
          point.route_type === "wire"
            ? [point.x, point.y, point.layer, point.width]
            : [point.x, point.y, point.from_layer, point.to_layer],
        )
    record = {
      mode,
      inputSha256: createHash("sha256")
        .update(JSON.stringify(input))
        .digest("hex"),
      complete:
        errors(second.rows) === 0 &&
        endpoints.every((endpoint) =>
          wires.some(
            (point) =>
              Math.hypot(point.x - endpoint.x, point.y - endpoint.y) < 1e-8 &&
              point.layer === endpoint.layer,
          ),
        ),
      firstStageCalls: second.firstStageCalls,
      followUpCalls: second.followUpCalls,
      stageCounts: [first.ends.length, second.ends.length],
      firstErrors: errors(first.rows),
      secondErrors: errors(second.rows),
      retryCacheStatus: second.starts[0]?.cacheStatus,
      prefixGeometryUnchanged:
        mode === "native_control" ||
        JSON.stringify(geometry(prefix?.route ?? [])) ===
          JSON.stringify(geometry(first.firstStageTraces[0]?.route ?? [])),
      outputSha256: createHash("sha256")
        .update(JSON.stringify(nativeCopper))
        .digest("hex"),
    }
  }
  times.sort((a, b) => a - b)
  reports.push({ ...record, medianMs: times[2], trialsMs: times })
}
const result = {
    scope:
      "Synthetic native Core stage/cache regression fixtures; not an AM3352 timing benchmark",
    bun: Bun.version,
    cases: reports,
  },
  json = JSON.stringify(result, null, 2) + "\n"
if (process.argv[2]) writeFileSync(process.argv[2], json)
console.log(json)
