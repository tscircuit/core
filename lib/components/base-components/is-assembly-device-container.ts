/**
 * An assembly device container is a product-level wrapper (today only `<assembly.device>`)
 * that may sit above a `<board>` without being an electrical group or
 * subcircuit. Components that would otherwise assume "my parent is a
 * subcircuit" use this to opt out.
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
