import { selectOne } from "css-select"
import type { PrimitiveComponent } from "../../components/base-components/PrimitiveComponent"
import { RootCircuit } from "../../RootCircuit"
import { cssSelectorAdapter } from "./css-select-adapter"

/**
 * Recursively search for a component in the circuit tree
 */
function findComponentRecursively(
  element: PrimitiveComponent | RootCircuit,
  predicate: (component: PrimitiveComponent) => boolean,
  deep = true
): PrimitiveComponent | null {
  // For RootCircuit, search its children
  if (element instanceof RootCircuit) {
    for (const child of element.children) {
      if (predicate(child)) {
        return child
      }
      
      if (deep) {
        const result = findComponentRecursively(child, predicate, deep)
        if (result) return result
      }
    }
    return null
  }
  
  // For PrimitiveComponent, search its children
  for (const child of element.children) {
    if (predicate(child)) {
      return child
    }
    
    if (deep) {
      const result = findComponentRecursively(child, predicate, deep)
      if (result) return result
    }
  }
  
  return null
}

/**
 * Helper function to find a direct child matching a selector
 */
function findDirectChild(
  parent: PrimitiveComponent | RootCircuit,
  selector: string
): PrimitiveComponent | null {
  if (!parent) return null
  
  const children = parent instanceof RootCircuit ? parent.children : parent.children
  
  // Class selector (e.g., ".className")
  const classMatch = selector.match(/^\.([a-zA-Z0-9]+)$/)
  if (classMatch) {
    const [_, className] = classMatch
    return children.find(child => 
      child.props.name === className || 
      child._parsedProps?.name === className
    ) || null
  }
  
  // Tag selector (e.g., "div")
  const tagMatch = selector.match(/^([a-zA-Z0-9]+)$/)
  if (tagMatch) {
    const [_, tagName] = tagMatch
    return children.find(child => 
      child.lowercaseComponentName === tagName.toLowerCase()
    ) || null
  }
  
  // Combined selector (e.g., "div.className")
  const combinedMatch = selector.match(/^([a-zA-Z0-9]+)\.([a-zA-Z0-9]+)$/)
  if (combinedMatch) {
    const [_, tagName, className] = combinedMatch
    return children.find(child => 
      child.lowercaseComponentName === tagName.toLowerCase() &&
      (child.props.name === className || child._parsedProps?.name === className)
    ) || null
  }
  
  return null
}

/**
 * Custom wrapper for css-select's selectOne function that handles direct child
 * selectors with class names properly for our component hierarchy.
 * 
 * This custom implementation is needed because the standard css-select's selectOne
 * function doesn't properly handle our component hierarchy, especially for
 * direct child selectors with class names (e.g., "board > .R1").
 * 
 * While css-select itself supports direct child selectors, our adapter implementation
 * can't fully support all the intricacies of our component model, especially with
 * how we handle component names as CSS classes.
 */
export function customSelectOne(
  selector: string,
  element: PrimitiveComponent | RootCircuit,
  options?: { adapter?: typeof cssSelectorAdapter }
): PrimitiveComponent | null {
  // Initialize options with our adapter if not provided
  const opts = options || { adapter: cssSelectorAdapter }
  
  // Handle multi-level child selectors (e.g., "group > .G2 > .C1")
  if (selector.includes('>')) {
    const parts = selector.split('>').map(s => s.trim())
    
    // Start by finding the first part
    let current: PrimitiveComponent | RootCircuit | null = element
    let firstPart = parts[0]
    
    // Find the first part in the hierarchy
    if (firstPart !== '') {
      current = customSelectOne(firstPart, element, opts)
      if (!current) return null
    }
    
    // Then traverse each subsequent part
    for (let i = 1; i < parts.length && current; i++) {
      current = findDirectChild(current, parts[i])
      if (!current) return null
    }
    
    return current as PrimitiveComponent
  }
  
  // Check if this is just a simple tag selector
  const simpleTagMatch = selector.match(/^([a-zA-Z0-9]+)$/)
  if (simpleTagMatch) {
    const [_, tagName] = simpleTagMatch
    
    return findComponentRecursively(element, component => 
      component.lowercaseComponentName === tagName.toLowerCase()
    )
  }
  
  // Check if this is just a simple class selector
  const simpleClassMatch = selector.match(/^\.([a-zA-Z0-9]+)$/)
  if (simpleClassMatch) {
    const [_, className] = simpleClassMatch
    
    return findComponentRecursively(element, component => 
      (component.props.name === className || component._parsedProps.name === className)
    )
  }
  
  // Check for attribute selector
  const attributeMatch = selector.match(/^\[([a-zA-Z0-9_]+)=['"]([^'"]*)['"]?\]$/)
  if (attributeMatch) {
    const [_, attrName, attrValue] = attributeMatch
    
    return findComponentRecursively(element, component => 
      component.props[attrName]?.toString() === attrValue || 
      component._parsedProps[attrName]?.toString() === attrValue
    )
  }
  
  // Check for combined tag and class
  const combinedMatch = selector.match(/^([a-zA-Z0-9]+)\.([a-zA-Z0-9]+)$/)
  if (combinedMatch) {
    const [_, tagName, className] = combinedMatch
    
    return findComponentRecursively(element, component => 
      component.lowercaseComponentName === tagName.toLowerCase() &&
      (component.props.name === className || component._parsedProps.name === className)
    )
  }
  
  // For all other selectors, use the standard selectOne
  return selectOne(selector, element, opts)
}