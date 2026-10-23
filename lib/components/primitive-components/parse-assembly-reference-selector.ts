/** Parse the authored `part.reference` syntax shared by assembly mounts and
 * cable endpoints. The part path may include named assembly ancestors.
 */
export const parseAssemblyReferenceSelector = (selector: string) => {
  const separator = selector.lastIndexOf(".")
  if (separator < 1 || separator === selector.length - 1) return
  return {
    partName: selector.slice(0, separator),
    faceName: selector.slice(separator + 1),
  }
}
