import { readFileSync } from "node:fs"
const base = JSON.parse(readFileSync(process.argv[2]!, "utf8")),
  head = JSON.parse(readFileSync(process.argv[3]!, "utf8"))
for (const current of head.cases) {
  const previous = base.cases.find((row: any) => row.mode === current.mode)
  if (
    !previous ||
    typeof current.inputSha256 !== "string" ||
    current.inputSha256.length !== 64 ||
    previous.inputSha256 !== current.inputSha256
  )
    throw Error("Benchmark inputs differ")
  if (
    !current.complete ||
    current.secondErrors ||
    !current.prefixGeometryUnchanged
  )
    throw Error("Follow-up did not finish with unchanged prefix")
  if (current.mode === "native_control") {
    if (previous.outputSha256 !== current.outputSha256)
      throw Error("Native control copper changed")
  } else if (
    current.firstStageCalls !== 1 ||
    current.followUpCalls !== 2 ||
    current.retryCacheStatus !== "hit"
  )
    throw Error("Custom prefix was not reused")
  if (current.mode === "failed_followup" && !current.firstErrors)
    throw Error("Expected follow-up failure was not exercised")
}
console.log(
  "All cases complete; failed-tail retry retains cached prefix; native control copper is identical.",
)
