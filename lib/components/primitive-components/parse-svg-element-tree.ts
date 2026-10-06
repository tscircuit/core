import type { SvgElementNode } from "./svg-element-css-select-adapter"

export type SvgElementTag = {
  element?: SvgElementNode
  end: number
  raw: string
  start: number
}

const findTagEnd = (svg: string, tagStart: number): number => {
  let quote: '"' | "'" | undefined
  for (let index = tagStart + 1; index < svg.length; index += 1) {
    const character = svg[index]
    if (quote) {
      if (character === quote) quote = undefined
    } else if (character === '"' || character === "'") {
      quote = character
    } else if (character === ">") {
      return index + 1
    }
  }
  return svg.length
}

const getAttributes = (tag: string): Record<string, string> => {
  const attributes: Record<string, string> = {}
  const attributePattern =
    /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s/>]+))/gu
  for (const match of tag.matchAll(attributePattern)) {
    const name = match[1]
    if (name) attributes[name] = match[2] ?? match[3] ?? match[4] ?? ""
  }
  return attributes
}

const appendChild = (
  parent: SvgElementNode | null,
  child: SvgElementNode,
): void => {
  if (!parent) return
  const previousSibling = parent.children.at(-1) ?? null
  child.previousSibling = previousSibling
  if (previousSibling) previousSibling.nextSibling = child
  parent.children.push(child)
}

export const parseSvgElementTree = (svg: string): SvgElementTag[] => {
  const tags: SvgElementTag[] = []
  const openElements: SvgElementNode[] = []
  for (
    let start = svg.indexOf("<");
    start >= 0;
    start = svg.indexOf("<", start)
  ) {
    if (svg.startsWith("<!--", start)) {
      const commentEnd = svg.indexOf("-->", start + 4)
      start = commentEnd < 0 ? svg.length : commentEnd + 3
      continue
    }
    if (svg.startsWith("<![CDATA[", start)) {
      const cdataEnd = svg.indexOf("]]>", start + 9)
      start = cdataEnd < 0 ? svg.length : cdataEnd + 3
      continue
    }
    const end = findTagEnd(svg, start)
    const raw = svg.slice(start, end)
    const tagMatch = raw.match(/^<\s*(\/?)\s*([a-z_][\w:.-]*)/iu)
    if (!tagMatch) {
      start = end
      continue
    }
    const isClosing = tagMatch[1] === "/"
    const name = tagMatch[2]!.toLowerCase()
    if (isClosing) {
      const matchingIndex = openElements.findLastIndex(
        (element) => element.name === name,
      )
      if (matchingIndex >= 0) openElements.length = matchingIndex
      tags.push({ end, raw, start })
      start = end
      continue
    }
    const parent = openElements.at(-1) ?? null
    const element: SvgElementNode = {
      attributes: getAttributes(raw),
      children: [],
      name,
      nextSibling: null,
      parent,
      previousSibling: null,
    }
    appendChild(parent, element)
    tags.push({ element, end, raw, start })
    if (!/\/\s*>$/u.test(raw)) openElements.push(element)
    start = end
  }
  return tags
}
