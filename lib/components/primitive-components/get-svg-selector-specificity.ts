import { AttributeAction, type Selector, SelectorType } from "css-what"

export const getSvgSelectorSpecificity = (selector: Selector[]): number => {
  let idCount = 0
  let classCount = 0
  let tagCount = 0
  let nestedSpecificity = 0
  for (const token of selector) {
    if (token.type === SelectorType.Tag) tagCount += 1
    if (token.type === SelectorType.PseudoElement) tagCount += 1
    if (token.type === SelectorType.Attribute) {
      if (
        token.name === "id" &&
        token.action === AttributeAction.Equals &&
        token.ignoreCase === "quirks"
      ) {
        idCount += 1
      } else {
        classCount += 1
      }
    }
    if (token.type === SelectorType.Pseudo) {
      if (token.name === "where") continue
      if (
        (token.name === "is" || token.name === "not" || token.name === "has") &&
        Array.isArray(token.data)
      ) {
        nestedSpecificity += Math.max(
          0,
          ...token.data.map(getSvgSelectorSpecificity),
        )
      } else {
        classCount += 1
      }
    }
  }
  return idCount * 1_000_000 + classCount * 1_000 + tagCount + nestedSpecificity
}
