import type { PrimitiveComponent } from "lib/components"

/**
 * CSS-Select adapter for PrimitiveComponent
 * This adapter allows css-select to work with our PrimitiveComponent tree structure
 */
export const cssSelectPrimitiveComponentAdapter = {
  // Is the node an element?
  isTag: (node: PrimitiveComponent) => true,

  // Get the parent of the node
  getParent: (node: PrimitiveComponent) => node.parent,

  // Get the children of the node
  getChildren: (node: PrimitiveComponent) => node.children,

  // Get the name of the tag
  getName: (node: PrimitiveComponent) => node.lowercaseComponentName,

  // Get the attribute value
  getAttributeValue: (node: PrimitiveComponent, name: string) => {
    // Handle class selector based on the component's name prop
    if (name === "class" && "getNameAndAliases" in node) {
      return node.getNameAndAliases().join(" ")
    }
    // Handle attribute selector for 'name' (redundant if class handles it, but safe to keep)
    if (name === "name" && node._parsedProps?.name) {
      return node._parsedProps.name
    }
    // Handle other attribute selectors based on props
    if (node._parsedProps && name in node._parsedProps) {
      const value = node._parsedProps[name]
      // css-select might expect string values for attributes
      return typeof value === "string"
        ? value
        : value !== null && value !== undefined
          ? String(value)
          : null
    }
    return null
  },

  // Check if a node has an attribute
  hasAttrib: (node: PrimitiveComponent, name: string) => {
    // Check for 'class' based on the component's name prop
    if (name === "class") {
      return !!node._parsedProps?.name
    }
    // Check for other attributes based on props
    return node._parsedProps && name in node._parsedProps
  },

  // Get a list of attribute names
  getAttributeNames: (node: PrimitiveComponent) => {
    return Object.keys(node._parsedProps || {})
  },

  // Get the siblings of the node
  getSiblings: (node: PrimitiveComponent) => {
    if (!node.parent) return []
    return node.parent.children
  },

  // Get the next sibling
  nextElementSibling: (node: PrimitiveComponent) => {
    if (!node.parent) return null
    const siblings = node.parent.children
    const idx = siblings.indexOf(node)
    return idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null
  },

  // Get the previous sibling
  prevElementSibling: (node: PrimitiveComponent) => {
    if (!node.parent) return null
    const siblings = node.parent.children
    const idx = siblings.indexOf(node)
    return idx > 0 ? siblings[idx - 1] : null
  },

  // Get the text content
  getText: () => "",

  // Get the text content of the node and its children
  getInnerHTML: () => "",

  // Get the HTML of the node's children
  getOuterHTML: (node: PrimitiveComponent) => node.getString(),

  // Remove the node
  removeSubsets: (nodes: PrimitiveComponent[]) => {
    return nodes.filter(
      (node, i) =>
        !nodes.some(
          (other, j) =>
            i !== j && other !== node && other.getDescendants().includes(node),
        ),
    )
  },

  // Determine if element a is a subset of element b
  existsOne: (
    test: (node: PrimitiveComponent) => boolean,
    nodes: PrimitiveComponent[],
  ) => {
    return nodes.some(test)
  },

  // Find all elements matching a selector
  findAll: (
    test: (node: PrimitiveComponent) => boolean,
    nodes: PrimitiveComponent[],
  ) => {
    const result: PrimitiveComponent[] = []

    const recurse = (node: PrimitiveComponent) => {
      if (test(node)) {
        result.push(node)
      }

      for (const child of node.children) {
        recurse(child)
      }
    }

    for (const node of nodes) {
      recurse(node)
    }

    return result
  },

  // Find one element matching a selector
  findOne: (
    test: (node: PrimitiveComponent) => boolean,
    nodes: PrimitiveComponent[],
  ): PrimitiveComponent | null => {
    for (const node of nodes) {
      if (test(node)) return node

      const children = node.children
      if (children.length > 0) {
        const result = cssSelectPrimitiveComponentAdapter.findOne(
          test,
          children,
        )
        if (result) return result
      }
    }

    return null
  },

  // Get the ID attribute
  getElementById: (id: string, nodes: PrimitiveComponent[]) => {
    return cssSelectPrimitiveComponentAdapter.findOne(
      (node) => node._renderId === id,
      nodes,
    )
  },
}
