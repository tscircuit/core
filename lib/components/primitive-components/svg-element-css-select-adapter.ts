import type { Options } from "css-select"

export type SvgElementNode = {
  attributes: Record<string, string>
  children: SvgElementNode[]
  name: string
  nextSibling: SvgElementNode | null
  parent: SvgElementNode | null
  previousSibling: SvgElementNode | null
}

const findAll = (
  test: (element: SvgElementNode) => boolean,
  elements: SvgElementNode[],
): SvgElementNode[] => {
  const matches: SvgElementNode[] = []
  for (const element of elements) {
    if (test(element)) matches.push(element)
    matches.push(...findAll(test, element.children))
  }
  return matches
}

const findOne = (
  test: (element: SvgElementNode) => boolean,
  elements: SvgElementNode[],
): SvgElementNode | null => {
  for (const element of elements) {
    if (test(element)) return element
    const descendant = findOne(test, element.children)
    if (descendant) return descendant
  }
  return null
}

export const svgElementCssSelectAdapter: Required<
  Options<SvgElementNode, SvgElementNode>["adapter"]
> = {
  equals: (first, second) => first === second,
  existsOne: (test, elements) => findOne(test, elements) !== null,
  findAll,
  findOne,
  getAttributeValue: (element, name) => element.attributes[name],
  getChildren: (element) => element.children,
  getName: (element) => element.name,
  getParent: (element) => element.parent,
  getSiblings: (element) => element.parent?.children ?? [element],
  getText: () => "",
  hasAttrib: (element, name) => name in element.attributes,
  isActive: () => false,
  isHovered: () => false,
  isTag: (node): node is SvgElementNode => true,
  isVisited: () => false,
  prevElementSibling: (element) => element.previousSibling,
  removeSubsets: (elements) => {
    const elementSet = new Set(elements)
    return elements.filter((element) => {
      for (let parent = element.parent; parent; parent = parent.parent) {
        if (elementSet.has(parent)) return false
      }
      return true
    })
  },
}
