function splitWhitespace(line: string) {
  return line.split("\t").join(" ").split(" ").filter(Boolean)
}

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
  for (const rawLine of source.split("\n")) {
    const line = rawLine.split("|")[0].trim()
    if (!line) continue
    const headerEnd = line.indexOf("]")
    if (line.startsWith("[") && headerEnd !== -1) {
      // IBIS keywords treat "_" and " " alike, e.g. [Diff Pin] and [Diff_Pin].
      section = line.slice(1, headerEnd).toLowerCase().replaceAll("_", " ")
      const name = line.slice(headerEnd + 1).trim()
      switch (section) {
        case "component":
          component = {
            pinModels: new Map(),
            differentialPins: new Map(),
            coupledPackage: false,
          }
          components.set(name, component)
          break
        case "package model":
          if (component) component.coupledPackage = true
          break
        case "model":
          modelName = name
          break
        case "model selector":
          selectorName = name
          modelSelectors.set(name, [])
          break
      }
      continue
    }
    const fields = splitWhitespace(line)
    switch (section) {
      case "pin":
        component?.pinModels.set(fields[0], fields[2])
        break
      case "diff pin":
        component?.differentialPins.set(fields[0], fields[1])
        break
      case "model selector":
        modelSelectors.get(selectorName)!.push(fields[0])
        break
      case "model": {
        const [keyword, ...value] = splitWhitespace(line.replace("=", " "))
        if (keyword.toLowerCase() === "model_type")
          modelTypes.set(modelName, value.join(" ").toLowerCase())
        break
      }
    }
  }
  return { components, modelTypes, modelSelectors }
}
