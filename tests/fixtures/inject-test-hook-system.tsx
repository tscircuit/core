import React from "react"

/**
 * Overrides React globals to allow for testing hooks.
 */
export const injectTestHookSystem = (testFn: () => any) => {
  let hookIndex = 0
  const useEffects: any[] = []
  const useStates: any[] = []

  React.useEffect = (fn, deps) => {
    useEffects[hookIndex] = { fn, deps }
    hookIndex++
  }

  React.useState = ((initialState: any) => {
    const currentHookIndex = hookIndex
    hookIndex++
    const prevUseState = useStates[currentHookIndex]
    const latestState = prevUseState ? prevUseState.latestState : initialState
    useStates[currentHookIndex] = {
      initialState,
      states: [initialState],
      ...prevUseState,
      latestState,
    }
    return [
      prevUseState ? prevUseState.latestState : initialState,
      (newState: any) => {
        useStates[currentHookIndex].states.push(newState)
        useStates[currentHookIndex].latestState = newState
      },
    ]
  }) as any

  const runEffects = () => {
    for (const ue of useEffects) {
      if (ue && "fn" in ue) {
        ue.fn()
      }
    }
  }

  const renderHook = () => {
    hookIndex = 0
    return testFn()
  }

  return { runEffects, renderHook }
}
