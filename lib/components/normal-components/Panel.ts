import { panelProps } from "@tscircuit/props"
import { Subpanel } from "./Subpanel"

/**
 * Panel is the root-level panel component for organizing multiple boards.
 * It extends Subpanel and uses the same logic - the only difference is
 * the component name (Panel vs Subpanel) for semantic clarity.
 *
 * Both Panel and Subpanel:
 * - Can contain Board elements
 * - Can contain Subpanel elements (for nested grouping)
 * - Support grid layout mode for automatic board positioning
 * - Support tab routing and mouse bites for panelization
 */
export class Panel extends Subpanel {
  get config() {
    return {
      componentName: "Panel",
      zodProps: panelProps,
    }
  }
}
