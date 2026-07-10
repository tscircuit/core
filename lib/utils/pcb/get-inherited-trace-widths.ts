type TraceWidthInheritanceSource = {
  getInheritedProperty(propertyName: string): unknown
}

export interface InheritedTraceWidths {
  minTraceWidth: number
  nominalTraceWidth: number
}

export function getInheritedTraceWidths(
  source: TraceWidthInheritanceSource,
  fallbackMinTraceWidth: number,
): InheritedTraceWidths {
  const minTraceWidth = Number(
    source.getInheritedProperty("minTraceWidth") ?? fallbackMinTraceWidth,
  )
  const nominalTraceWidth = Number(
    source.getInheritedProperty("defaultTraceWidth") ??
      source.getInheritedProperty("nominalTraceWidth") ??
      minTraceWidth,
  )

  return {
    minTraceWidth,
    nominalTraceWidth,
  }
}

export function getInheritedTraceWidthForUnspecifiedTrace(
  source: TraceWidthInheritanceSource,
  fallbackMinTraceWidth: number,
): number {
  return getInheritedTraceWidths(source, fallbackMinTraceWidth)
    .nominalTraceWidth
}
