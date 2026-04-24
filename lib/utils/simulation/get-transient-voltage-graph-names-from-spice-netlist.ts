import type { SpiceNetlist } from "circuit-json-to-spice"

export function getTransientVoltageGraphNamesFromSpiceNetlist(
  spiceNetlist: SpiceNetlist,
): string[] {
  const graphNames: string[] = []

  for (const printStatement of spiceNetlist.printStatements) {
    const match = printStatement.match(/^\.PRINT\s+TRAN\s+(.+)$/i)
    if (!match) continue

    for (const voltageExpression of match[1].match(/V\(([^)]+)\)/g) ?? []) {
      const nodeList = voltageExpression.slice(2, -1)
      graphNames.push(nodeList.replace(",", "-"))
    }
  }

  return graphNames
}
