import type { PcbTrace, PcbVia, SourceTrace } from "circuit-json"
import type { Trace } from "./Trace"

export interface ImportedTracePayload {
  importedPcbTraces?: PcbTrace[]
  importedPcbVias?: PcbVia[]
  importedSourceTrace?: SourceTrace
}

const importedTracePayloadByTrace = new WeakMap<Trace, ImportedTracePayload>()

export const setImportedTracePayload = (
  trace: Trace,
  payload: ImportedTracePayload,
) => {
  importedTracePayloadByTrace.set(trace, payload)
}

export const getImportedTracePayload = (
  trace: Trace,
): ImportedTracePayload | undefined => importedTracePayloadByTrace.get(trace)
