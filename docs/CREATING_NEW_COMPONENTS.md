# Creating New Components

If you got an error like `Unsupported component type (not registered in @tscircuit/core catalogue)`, you'll probably need to create a new component.

## Steps to creating a new component

- Determine if the component is a normal component or a primitive component
  - Normal components are things like resistors, capacitors, diodes, etc.
  - Primitive components are things like traces, holes, texts, etc.
- If it's a normal component, create a new file in `lib/components/normal-components`
- If it's a primitive component, create a new file in `lib/components/primitive-components`
- Add the component to the catalogue by exporting it from the `lib/components/index.ts` file
- Add the component to the `intrinsic-jsx.ts` file
- Create a test for the component

## Getting Props for a Component

Component props are defined in `@tscircuit/props` like so:

```ts
import { silkscreenPathProps, type SilkscreenPathProps } from "@tscircuit/props"
```

Most components are defined the zod definition for their props.

## Implementing Render Phases

For a new component, you'll want to determine what render phases need to be implemented.

For something like a PCB primitive, you might only need to implement a phase like `doInitialPcbPrimitiveRender`. Look for a similar component to copy/understand what needs to be implemented. For example

## Writing a Test

Every new component should have a test written for it. This test should be in `tests/components/` and should be named `<component-name>.test.tsx`.

Usually a test for a new component has a very simple test definition like this:

```tsx
import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<mycomponent />", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <mycomponent />
    </board>
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
```
