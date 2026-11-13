/** Only metadata needed for render-time validation, never numerical IBIS data. */
export function parseIbisModelInfo(source: string) {
  const components = new Map<
    string,
    {
      pinModels: Map<string, string>
      differentialPins: Map<string, string>
      coupledPackage: boolean
    }
  >()
  const modelTypes = new Map<string, string>()
  const modelSelectors = new Map<string, string[]>()
  let component: ReturnType<typeof components.get>
  let section = ""
  let modelName = ""
  let selectorName = ""
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.split("|")[0].trim()
    if (!line) continue
    const header = line.match(/^\[([^\]]+)\]\s*(.*)/)
    if (header) {
      section = header[1].toLowerCase()
      if (section === "component") {
        component = {
          pinModels: new Map(),
          differentialPins: new Map(),
          coupledPackage: false,
        }
        components.set(header[2], component)
      }
      if (section === "package model" && component)
        component.coupledPackage = true
      if (section === "model") modelName = header[2]
      if (section === "model selector") {
        selectorName = header[2]
        modelSelectors.set(selectorName, [])
      }
      continue
    }
    const fields = line.split(/\s+/)
    if (section === "pin" && component)
      component.pinModels.set(fields[0], fields[2])
    if (section === "diff_pin" && component)
      component.differentialPins.set(fields[0], fields[1])
    if (section === "model selector")
      modelSelectors.get(selectorName)!.push(fields[0])
    if (section === "model" && /^model_type\s*(?:=|\s)/i.test(line))
      modelTypes.set(
        modelName,
        line.replace(/^model_type\s*=?\s*/i, "").toLowerCase(),
      )
  }
  return { components, modelTypes, modelSelectors }
}
