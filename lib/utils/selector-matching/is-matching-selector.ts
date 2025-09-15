import type { PrimitiveComponent } from "lib/components";

/**
 * Determines if a component matches a given selector.
 *
 * This function supports the following selector types:
 * - ID selectors (#id)
 * - Class selectors (.className)
 * - Type selectors (resistor)
 * - Attribute selectors ([key='value'])
 *
 * It also supports combinations of these selectors.
 *
 * @param component - The component to check.
 * @param selector - The selector string to match against.
 * @returns True if the component matches the selector, false otherwise.
 */
export function isMatchingSelector(
  component: PrimitiveComponent,
  selector: string,
): boolean {
  // Check for ID selector
  const idMatch = selector.match(/^#(\w+)/);
  if (idMatch) {
    return component.props.id === idMatch[1];
  }

  // Check for class selector
  const classMatch = selector.match(/^\.(\w+)/);
  if (classMatch) {
    return component.isMatchingNameOrAlias(classMatch[1]);
  }

  // Split the selector into type and conditions
  let [type, ...conditions] = selector.split(/(?=[#.[])/);

  if (type === "pin") type = "port";

  // Check if the component type matches
  if (
    type &&
    type !== "*" &&
    component.lowercaseComponentName !== type.toLowerCase()
  ) {
    return false;
  }

  // Check all conditions
  return conditions.every((condition) => {
    if (condition.startsWith("#")) {
      return component.props.id === condition.slice(1);
    }
    if (condition.startsWith(".")) {
      return component.isMatchingNameOrAlias(condition.slice(1));
    }

    // Check for attribute selector
    const match = condition.match(/\[(\w+)=['"]?(.+?)['"]?\]/);
    if (!match) return true;
    const [, prop, value] = match;
    return component.props[prop].toString() === value;
  });
}
