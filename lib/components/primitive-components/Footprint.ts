import type { footprintProps } from "@tscircuit/props"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"
import type { Constraint } from "./Constraint"
import * as kiwi from "@lume/kiwi"
import Debug from "debug"

const debug = Debug("tscircuit:core:footprint")

export class Footprint extends PrimitiveComponent<typeof footprintProps> {
  componentName = "Footprint"
  /**
   * A footprint is a constrainedlayout, the db elements are adjusted according
   * to any constraints that are defined.
   */
  doInitialPcbFootprintLayout() {
    const constraints = this.children.filter(
      (child) => child.componentName === "Constraint",
    ) as Constraint[]

    if (constraints.length === 0) return

    const { isFlipped } = this._getPcbPrimitiveFlippedHelpers()

    // If we're flipped, left/right is reversed for constraints
    const maybeFlipLeftRight = <T extends object>(props: T): T => {
      if (isFlipped) {
        if ("left" in props && "right" in props) {
          return {
            ...props,
            left: props.right,
            right: props.left,
          }
        }
      }
      return props
    }

    const involvedComponents = constraints
      .flatMap(
        (constraint) =>
          constraint._getAllReferencedComponents().componentsWithSelectors,
      )
      .map(({ component, selector, componentSelector, edge }) => ({
        component,
        selector,
        componentSelector,
        edge,
        bounds: component._getPcbCircuitJsonBounds(),
      }))

    if (involvedComponents.some((c) => c.edge)) {
      throw new Error(
        "edge constraints not implemented yet for footprint layout, contributions welcome!",
      )
    }

    function getComponentDetails(selector: string) {
      return involvedComponents.find(({ selector: s }) => s === selector)
    }

    const solver = new kiwi.Solver()

    const kVars: { [varName: string]: kiwi.Variable } = {}
    function getKVar(name: string) {
      if (!(name in kVars)) {
        kVars[name] = new kiwi.Variable(name)
        solver.addEditVariable(kVars[name], kiwi.Strength.weak)
      }
      return kVars[name]
    }

    // 1. Create kiwi variables to represent each component's center
    for (const { selector, bounds } of involvedComponents) {
      const kvx = getKVar(`${selector}_x`)
      const kvy = getKVar(`${selector}_y`)
      solver.suggestValue(kvx, bounds.center.x)
      solver.suggestValue(kvy, bounds.center.y)
    }

    // 2. Add kiwi constraints using the parsed constraint properties
    for (const constraint of constraints) {
      const props = constraint._parsedProps

      if ("xDist" in props) {
        const { xDist, left, right, edgeToEdge, centerToCenter } =
          maybeFlipLeftRight(props)
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
              props.xDist,
              kiwi.Strength.required,
            ),
          )
        } else if (edgeToEdge) {
          // rightEdge - leftEdge = xdist
          // right - rightBounds.width/2 - left - leftBounds.width/2 = xdist
          const expr = new kiwi.Expression(
            rightVar,
            -rightBounds.width / 2,
            [-1, leftVar],
            -leftBounds.width / 2,
          )
          solver.addConstraint(
            new kiwi.Constraint(
              expr,
              kiwi.Operator.Eq,
              props.xDist,
              kiwi.Strength.required,
            ),
          )
        }
      } else if ("yDist" in props) {
        const { yDist, top, bottom, edgeToEdge, centerToCenter } = props
        const topVar = getKVar(`${top}_y`)
        const bottomVar = getKVar(`${bottom}_y`)
        const topBounds = getComponentDetails(top)?.bounds!
        const bottomBounds = getComponentDetails(bottom)?.bounds!

        // Top - Bottom = ydist

        if (centerToCenter) {
          // top - bottom = ydist
          const expr = new kiwi.Expression(topVar, [-1, bottomVar])
          solver.addConstraint(
            new kiwi.Constraint(
              expr,
              kiwi.Operator.Eq,
              props.yDist,
              kiwi.Strength.required,
            ),
          )
        } else if (edgeToEdge) {
          // topElmBottomEdge - bottomElmTopEdge = ydist
          // topElmCenterY - topElmHeight/2 - bottomElmCenterY - bottomElmHeight/2 = ydist
          const expr = new kiwi.Expression(
            topVar,
            topBounds.height / 2,
            [-1, bottomVar],
            -bottomBounds.height / 2,
          )
          solver.addConstraint(
            new kiwi.Constraint(
              expr,
              kiwi.Operator.Eq,
              props.yDist,
              kiwi.Strength.required,
            ),
          )
        }
      } else if ("sameY" in props) {
        const { for: selectors } = props
        if (selectors.length < 2) continue
        const vars = selectors.map((selector) => getKVar(`${selector}_y`))
        const expr = new kiwi.Expression(...vars.slice(1))

        solver.addConstraint(
          new kiwi.Constraint(
            expr,
            kiwi.Operator.Eq,
            vars[0],
            kiwi.Strength.required,
          ),
        )
      } else if ("sameX" in props) {
        const { for: selectors } = props
        if (selectors.length < 2) continue
        const vars = selectors.map((selector) => getKVar(`${selector}_x`))
        const expr = new kiwi.Expression(...vars.slice(1))
        solver.addConstraint(
          new kiwi.Constraint(
            expr,
            kiwi.Operator.Eq,
            vars[0],
            kiwi.Strength.required,
          ),
        )
      }
    }

    // 3. Solve the system of equations
    solver.updateVariables()
    if (debug.enabled) {
      console.log("Solution to layout constraints:")
      console.table(
        Object.entries(kVars).map(([key, kvar]) => ({
          var: key,
          val: kvar.value(),
        })),
      )
    }

    // 3.1 Compute the global offset. There are different ways to do this:
    // - If any component has a fixed position, then that can be used as the
    //   origin to determine the offset of all other components
    // - If no component has a fixed position, then we recenter everything
    //   using the new bounds of all the involved components

    // TODO determine if there's a fixed component

    // Determine the new bounds all the involved components and compute the
    // bounds of this footprint
    const bounds = {
      left: Infinity,
      right: -Infinity,
      top: -Infinity,
      bottom: Infinity,
    }
    for (const {
      selector,
      bounds: { width, height },
    } of involvedComponents) {
      const kvx = getKVar(`${selector}_x`)
      const kvy = getKVar(`${selector}_y`)

      const newLeft = kvx.value() - width / 2
      const newRight = kvx.value() + width / 2
      const newTop = kvy.value() + height / 2
      const newBottom = kvy.value() - height / 2

      bounds.left = Math.min(bounds.left, newLeft)
      bounds.right = Math.max(bounds.right, newRight)
      bounds.top = Math.max(bounds.top, newTop)
      bounds.bottom = Math.min(bounds.bottom, newBottom)
    }

    // Compute the global offset, we can use this to recenter each component
    const globalOffset = {
      x: -(bounds.right + bounds.left) / 2,
      y: -(bounds.top + bounds.bottom) / 2,
    }

    const containerPos =
      this.getPrimitiveContainer()!._getGlobalPcbPositionBeforeLayout()

    globalOffset.x += containerPos.x
    globalOffset.y += containerPos.y

    // 4. Update the component positions
    for (const { component, selector } of involvedComponents) {
      const kvx = getKVar(`${selector}_x`)
      const kvy = getKVar(`${selector}_y`)
      component._setPositionFromLayout({
        x: kvx.value() + globalOffset.x,
        y: kvy.value() + globalOffset.y,
      })
    }
  }
}
