/**
 * An assembly-device element is a product-level `<assembly.device>` wrapper or
 * a semantic subtype such as `<assembly.screen>`. It is not an electrical group
 * or subcircuit. Components that would otherwise assume "my parent is a
 * subcircuit" use this marker to opt out.
 */
export interface AssemblyDeviceContainer {
  isAssemblyDeviceContainer: true
}

export const isAssemblyDeviceContainer = (
  component: unknown,
): component is AssemblyDeviceContainer =>
  typeof component === "object" &&
  component !== null &&
  "isAssemblyDeviceContainer" in component &&
  (component as { isAssemblyDeviceContainer?: unknown })
    .isAssemblyDeviceContainer === true
