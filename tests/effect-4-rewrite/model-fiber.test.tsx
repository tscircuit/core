import { expect, test } from "bun:test"
import { Resistor } from "lib/components"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { extendCatalogueEffect } from "lib/fiber/catalogue"
import {
  createCatalogueInstanceEffect,
  createInstanceFromReactElement,
  createInstanceFromReactElementEffect,
} from "lib/fiber/create-instance-from-react-element"
import { runCoreSync } from "lib/effect/core-error"
import { z } from "zod"
import { createElement } from "react"
import "lib/register-catalogue"

test("native React conversion preserves construction placeholders and sync extension hooks", () => {
  let attachments = 0
  class EffectExtensionContainer extends PrimitiveComponent {
    get config() {
      return {
        componentName: "EffectExtensionContainer",
        zodProps: z.object({}).passthrough(),
      }
    }
    add(child: PrimitiveComponent) {
      attachments++
      super.add(child)
    }
  }
  runCoreSync(extendCatalogueEffect({ EffectExtensionContainer }))
  const element = createElement(
    "effectextensioncontainer",
    {},
    createElement("resistor", { name: "R1", resistance: "1k" }),
  )
  const program = createInstanceFromReactElementEffect(element)
  expect(attachments).toBe(0)
  const native = runCoreSync(program)
  const facade = createInstanceFromReactElement(element)
  expect(native).toBeInstanceOf(EffectExtensionContainer)
  expect(facade).toBeInstanceOf(EffectExtensionContainer)
  expect(attachments).toBe(2)
  expect(native.children[0]).toBeInstanceOf(Resistor)
  expect(native.children[0]._parsedProps).toEqual(
    facade.children[0]._parsedProps,
  )
  const invalid = runCoreSync(
    createCatalogueInstanceEffect("resistor", { resistance: "1k", name: 42 }),
  )
  expect(invalid.componentName).toBe("ErrorPlaceholder")
  expect(invalid._parsedProps.error).toBeInstanceOf(Error)
  expect(() =>
    runCoreSync(createCatalogueInstanceEffect("missing_effect_test", {})),
  ).toThrow(/built-in-elements/)
})
