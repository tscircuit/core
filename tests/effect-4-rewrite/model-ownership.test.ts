import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import { RootCircuit } from "lib/RootCircuit"
import { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { corePromise, coreSync, runCoreSync } from "lib/effect/core-error"
import { z } from "zod"

test("tree mutations abort owned work, clean resources and suppress late writes", async () => {
  const circuit = new RootCircuit()
  const schema = z.object({
    name: z.string().optional(),
    value: z.number().optional(),
  })
  class ScopedPrimitive extends PrimitiveComponent<typeof schema> {
    get config() {
      return { componentName: "Test", zodProps: schema }
    }
    get root() {
      return circuit
    }
  }
  const parent = new ScopedPrimitive({ name: "parent" })
  const otherParent = new ScopedPrimitive({ name: "other" })

  function startOwnedJob(owner: ScopedPrimitive) {
    const observation = {
      signal: undefined as AbortSignal | undefined,
      resources: 0,
      commits: 0,
    }
    let releaseGate!: () => void
    let markStarted!: () => void
    const gate = new Promise<void>((resolve) => {
      releaseGate = resolve
    })
    const started = new Promise<void>((resolve) => {
      markStarted = resolve
    })
    const completion = circuit.effectRuntime.queue({
      owner,
      build: (job) =>
        Effect.scoped(
          Effect.gen(function* () {
            yield* Effect.acquireRelease(
              Effect.sync(() => {
                observation.resources++
              }),
              () =>
                Effect.sync(() => {
                  observation.resources--
                }),
            )
            yield* corePromise((signal) => {
              observation.signal = signal
              markStarted()
              return gate
            }, "test_pending_component_work")
            yield* coreSync(() => {
              job.commit(() => {
                observation.commits++
              })
            }, "test_component_write")
          }),
        ),
    })
    return { observation, started, completion, releaseGate }
  }

  const removedBranch = new ScopedPrimitive({ name: "removed" })
  const removedDescendant = new ScopedPrimitive({ name: "descendant" })
  parent.add(removedBranch)
  removedBranch.add(removedDescendant)
  const removed = startOwnedJob(removedDescendant)
  await removed.started
  expect(removed.observation.resources).toBe(1)
  runCoreSync(parent.removeEffect(removedBranch))
  await removed.completion
  expect(removed.observation.signal?.aborted).toBe(true)
  expect(removed.observation.resources).toBe(0)
  expect(parent.childrenPendingRemoval).toEqual([removedBranch])

  const changed = new ScopedPrimitive({ name: "changed", value: 1 })
  parent.add(changed)
  const updated = startOwnedJob(changed)
  await updated.started
  runCoreSync(changed.setPropsEffect({ value: 2 }))
  await updated.completion
  expect(updated.observation.signal?.aborted).toBe(true)
  expect(updated.observation.resources).toBe(0)
  expect(changed.props.value).toBe(2)

  const movedBranch = new ScopedPrimitive({ name: "moved" })
  const movedDescendant = new ScopedPrimitive({ name: "moving_child" })
  parent.add(movedBranch)
  movedBranch.add(movedDescendant)
  const moved = startOwnedJob(movedDescendant)
  await moved.started
  runCoreSync(otherParent.addEffect(movedBranch))
  await moved.completion
  expect(movedBranch.parent).toBe(otherParent)
  expect(moved.observation.signal?.aborted).toBe(true)
  expect(moved.observation.resources).toBe(0)
  // add retains the public callback/array contract; it does not remove old slots.
  expect(parent.children).toContain(movedBranch)

  for (const pending of [removed, updated, moved]) pending.releaseGate()
  await Promise.resolve()
  await Promise.resolve()
  expect(
    [removed, updated, moved].map((pending) => pending.observation.commits),
  ).toEqual([0, 0, 0])
  expect(circuit.effectRuntime.activeJobCount).toBe(0)

  const completed = startOwnedJob(changed)
  await completed.started
  completed.releaseGate()
  await completed.completion
  expect(completed.observation.commits).toBe(1)
  expect(completed.observation.resources).toBe(0)
  await circuit.dispose()
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
})
