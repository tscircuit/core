import type { Adapter } from "css-select"
import { RootCircuit } from "../../RootCircuit"
import type { PrimitiveComponent } from "../../components/base-components/PrimitiveComponent"

/**
 * Adapter for css-select library to work with RootCircuit component hierarchy
 */
export const createCssSelectorAdapter = (): Adapter<PrimitiveComponent | RootCircuit> => {
  const adapter: Adapter<PrimitiveComponent | RootCircuit> = {
    // Get the parent of an element
    getParent(elem: PrimitiveComponent | RootCircuit): PrimitiveComponent | RootCircuit | null {
      if (elem instanceof RootCircuit) return null
      return elem.parent
    },

    // Get the children of an element
    getChildren(elem: PrimitiveComponent | RootCircuit): (PrimitiveComponent | RootCircuit)[] {
      if (elem instanceof RootCircuit) {
        return elem.children
      }
      return elem.children
    },

    // Get the siblings of an element (including the element itself)
    getSiblings(elem: PrimitiveComponent): PrimitiveComponent[] {
      return elem.parent?.children || []
    },

    // Get the next sibling of an element
    getNextSibling(elem: PrimitiveComponent): PrimitiveComponent | null {
      if (!elem.parent) return null
      const siblings = elem.parent.children
      const index = siblings.indexOf(elem)
      return index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null
    },

    // Get the previous sibling of an element
    getPreviousSibling(elem: PrimitiveComponent): PrimitiveComponent | null {
      if (!elem.parent) return null
      const siblings = elem.parent.children
      const index = siblings.indexOf(elem)
      return index > 0 ? siblings[index - 1] : null
    },

    // Check if an element is a tag (not a RootCircuit)
    isTag(elem: PrimitiveComponent | RootCircuit): boolean {
      return !(elem instanceof RootCircuit)
    },

    // Get the name of an element (component type)
    getName(elem: PrimitiveComponent): string {
      return elem.lowercaseComponentName
    },

    // Get the attribute value for a name
    getAttributeValue(elem: PrimitiveComponent, name: string): string | undefined {
      // Special handling for class attribute (for .className selectors)
      if (name === 'class') {
        return elem._parsedProps.name || elem.props.name
      }
      
      return elem._parsedProps[name] ?? elem.props[name]
    },

    // Get all attributes
    getAttributes(elem: PrimitiveComponent): Record<string, string> {
      const attrs = { ...elem.props } as Record<string, string>
      // Add special class attribute for CSS selectors
      if (elem._parsedProps.name || elem.props.name) {
        attrs.class = elem._parsedProps.name || elem.props.name
      }
      return attrs
    },

    // Check if element has a specific attribute
    hasAttrib(elem: PrimitiveComponent, name: string): boolean {
      // Special handling for class attribute
      if (name === 'class') {
        return Boolean(elem._parsedProps.name || elem.props.name)
      }
      
      return name in elem._parsedProps || name in elem.props
    },

    // Check if any elements match the test
    existsOne(test: (elem: PrimitiveComponent) => boolean, elems: PrimitiveComponent[]): boolean {
      return elems.some(test)
    },

    // Find all elements that match the test
    findAll(test: (elem: PrimitiveComponent) => boolean, elems: PrimitiveComponent[]): PrimitiveComponent[] {
      return elems.filter(test)
    },

    // Find one element that matches the test
    findOne(test: (elem: PrimitiveComponent) => boolean, elems: PrimitiveComponent[]): PrimitiveComponent | null {
      return elems.find(test) || null
    },

    // Get attribute names
    getAttributeNames(elem: PrimitiveComponent): string[] {
      const attrs = new Set([
        ...Object.keys(elem._parsedProps || {}),
        ...Object.keys(elem.props || {})
      ])
      
      // Add 'class' if the element has a name
      if (elem._parsedProps.name || elem.props.name) {
        attrs.add('class')
      }
      
      return Array.from(attrs)
    },

    // Remove pseudo-classes from selector
    removePseudos(selector: string): string {
      return selector
    },

    // Check if attribute a is a subset of attribute b
    isSubset(a: string, b: string, elem: PrimitiveComponent): boolean {
      if (a === "class") {
        // Special handling for class selectors
        const className = b.startsWith(".") ? b.substring(1) : b
        return elem.isMatchingNameOrAlias(className)
      }
      return a === b
    },

    // Check if two values are equal
    equals(a: string, b: string): boolean {
      return a === b
    },

    // Additional required methods
    getText(): string {
      return ""
    },

    getNamespace(): string | null {
      return null
    },

    adapter: undefined as any
  }

  // Fix circular reference
  adapter.adapter = adapter
  
  return adapter
}

export const cssSelectorAdapter = createCssSelectorAdapter()