import { type FunctionComponent, createElement } from "react"

export const createNamespacedElement = <Props extends object>(
  hostType: string,
): FunctionComponent<Props> => {
  const Component: FunctionComponent<Props> = (props) =>
    createElement(hostType, props)

  Component.displayName = hostType
  return Component
}
