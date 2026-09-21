import * as circuitJsonUtil from "@tscircuit/circuit-json-util"

export function createCircuitJsonDatabase() {
  if (typeof circuitJsonUtil.cjuIndexed !== "function")
    return circuitJsonUtil.cju([])
  const indexed = circuitJsonUtil.cjuIndexed([], {
    indexConfig: { byId: true, byType: true },
  })
  // circuit-json-util <=0.0.114 declares these methods in its types but its
  // indexed proxy returns table objects for them. Retain compatibility with
  // those peer versions until indexed root operations are implemented upstream.
  if (
    typeof indexed.insert !== "function" ||
    typeof indexed.insertAll !== "function" ||
    typeof indexed.subtree !== "function"
  ) {
    return circuitJsonUtil.cju([])
  }
  return indexed
}
