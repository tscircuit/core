import { test, expect } from "bun:test"
import React from "react"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"
import { catalogue } from "lib/fiber/catalogue"
import "lib/register-catalogue"

// Allow any component name in JSX for testing invalid components
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any
    }
  }
}

test("invalid component throws improved error", () => {
  // Ensure catalogue is populated
  expect(Object.keys(catalogue).length).toBeGreaterThan(0)

  // Try to render an obviously invalid component
  const invalidElement = <unknowncomponent />

  let thrownError: Error | null = null
  expect(() => {
    try {
      createInstanceFromReactElement(invalidElement)
    } catch (err) {
      thrownError = err as Error
      throw err
    }
  }).toThrow()

  // Now verify the error message contents
  expect(thrownError).not.toBeNull()
  expect(thrownError!.message).toContain(
    'Unsupported component type "unknowncomponent"',
  )
  expect(thrownError!.message).toContain("Possible causes:")
  expect(thrownError!.message).toContain("Available components:")
  expect(thrownError!.message).toContain("CREATING_NEW_COMPONENTS.md")
})

test("empty catalogue throws appropriate error", () => {
  // Temporarily clear the catalogue
  const savedCatalogue = { ...catalogue }
  Object.keys(catalogue).forEach((key) => delete catalogue[key])

  try {
    const invalidElement = <unknowncomponent />
    expect(() => {
      createInstanceFromReactElement(invalidElement)
    }).toThrow(/No components registered in catalogue/)
  } finally {
    // Restore the catalogue
    Object.assign(catalogue, savedCatalogue)
  }
})
