type OverrideDispatchOptions = {
  readonly legacyFacade?: (...args: never[]) => unknown
}

/**
 * Choose an extension hook at an orchestration call site. The nearest own
 * definition wins; when an owner defines both methods, the Effect hook wins.
 * Inspect definitions without reading method getters during this decision.
 *
 * Some existing adapters instead give every changed synchronous method
 * precedence. Passing their base `legacyFacade` preserves that exception,
 * including its single read of the resolved synchronous method.
 *
 * A synchronous facade calls its canonical Effect method directly. It must not
 * dispatch back to itself: a legacy override calling `super` would recurse.
 * Method availability and foreign-object adaptation remain with the caller.
 */
export function prefersNativeMethod(
  target: object,
  syncName: string,
  effectName: string,
  options: OverrideDispatchOptions = {},
): boolean {
  if (options.legacyFacade !== undefined) {
    return Reflect.get(target, syncName) === options.legacyFacade
  }
  for (
    let methodOwner: object | null = target;
    methodOwner;
    methodOwner = Reflect.getPrototypeOf(methodOwner)
  ) {
    if (Object.hasOwn(methodOwner, effectName)) return true
    if (Object.hasOwn(methodOwner, syncName)) return false
  }
  return false
}
