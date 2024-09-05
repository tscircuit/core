import type { footprintProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { Constraint } from "./Constraint"
import * as kiwi from "@lume/kiwi"

export class Footprint extends PrimitiveComponent<typeof footprintProps> {
  /**
   * A footprint is a constrainedlayout, the db elements are adjusted according
   * to any constraints that are defined.
   */
  doInitialPcbLayout() {
    const constraints = this.children.filter(
      (child) => child.componentName === "Constraint",
    ) as Constraint[]

    if (constraints.length === 0) return

    const involvedComponents = constraints
      .flatMap(
        (constraint) =>
          constraint._getAllReferencedComponents().componentsWithSelectors,
      )
      .map(({ component, selector }) => ({
        component,
        selector,
        bounds: component._getCircuitJsonBounds(),
      }))

    function getComponentDetails(selector: string) {
      return involvedComponents.find(({ selector: s }) => s === selector)
    }

    const solver = new kiwi.Solver()

    const kVars: { [varName: string]: kiwi.Variable } = {}
    function getKVar(name: string) {
      if (!(name in kVars)) {
        kVars[name] = new kiwi.Variable(name)
      }
      return kVars[name]
    }

    // 1. Create kiwi variables to represent each component's center
    for (const { selector, bounds } of involvedComponents) {
      const kvx = getKVar(`${selector}_x`)
      const kvy = getKVar(`${selector}_y`)
      solver.addEditVariable(kvx, kiwi.Strength.weak)
      solver.addEditVariable(kvy, kiwi.Strength.weak)
      solver.suggestValue(kvx, bounds.center.x)
      solver.suggestValue(kvy, bounds.center.y)
    }

    // 2. Add kiwi constraints using the parsed constraint properties
    for (const constraint of constraints) {
      const props = constraint._parsedProps

      if ("xdist" in props) {
        const { xdist, left, right, edgeToEdge, centerToCenter } = props
        const leftVar = getKVar(`${left}_x`)
        const rightVar = getKVar(`${right}_x`)
        const leftBounds = getComponentDetails(left)?.bounds!
        const rightBounds = getComponentDetails(right)?.bounds!

        if (centerToCenter) {
          // right - left = xdist
          const expr = new kiwi.Expression(rightVar, [-1, leftVar])
          solver.addConstraint(
            new kiwi.Constraint(
              expr,
              kiwi.Operator.Eq,
              props.xdist,
              kiwi.Strength.medium,
            ),
          )
        } else if (edgeToEdge) {
          // rightEdge - leftEdge = xdist
          // right + rightBounds.width/2 - left - leftBounds.width/2 = xdist
          const expr = new kiwi.Expression(
            rightVar,
            rightBounds.width / 2,
            [-1, leftVar],
            -leftBounds.width / 2,
          )
          solver.addConstraint(
            new kiwi.Constraint(
              expr,
              kiwi.Operator.Eq,
              props.xdist,
              kiwi.Strength.medium,
            ),
          )
        }
      }

      // 3. Solve the system of equations
      solver.updateVariables()

      // 4. Update the component positions
      for (const { component, selector } of involvedComponents) {
        const kvx = getKVar(`${selector}_x`)
        const kvy = getKVar(`${selector}_y`)
        component._setPositionFromLayout({
          x: kvx.value(),
          y: kvy.value(),
        })
      }
    }
  }
}
