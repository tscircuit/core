import React, { Component, type ComponentProps } from "react"
import { z } from "zod"
import { resistorProps, resistorPins } from "@tscircuit/props"

export type ComponentWithPins<
  Props,
  PinLabel extends string | never = never,
  PropsFromHook extends Omit<Props, "name"> | undefined = undefined,
> = React.ComponentType<
  (PropsFromHook extends undefined
    ? Omit<Props, "name">
    : Omit<Partial<Props>, "name">) & {
    [key in PinLabel]?: string
  }
> & {
  [key in PinLabel]: string
}

export const createUseComponent = <
  Props,
  PinLabel extends string | never = never,
>(
  Component: React.ComponentType<Props>,
  pins:
    | readonly PinLabel[]
    | readonly (readonly PinLabel[])[]
    | { [key: string]: readonly PinLabel[] },
): (<PropsFromHook extends Omit<Props, "name"> | undefined = undefined>(
  name: string,
  props?: PropsFromHook,
) => ComponentWithPins<Props, PinLabel, PropsFromHook>) => {
  return <T extends Omit<Props, "name"> | undefined = undefined>(
    name: string,
    props?: T,
  ): ComponentWithPins<Props, PinLabel, T> => {
    const pinLabelsFlatArray: PinLabel[] = []
    if (Array.isArray(pins)) {
      pinLabelsFlatArray.push(...pins.flat())
    } else if (typeof pins === "object") {
      pinLabelsFlatArray.push(...Object.values(pins).flat())
      pinLabelsFlatArray.push(...(Object.keys(pins) as PinLabel[]))
    }
    const R: any = (props2: any) => {
      const combinedProps = { ...props, ...props2, name }
      const tracesToCreate: any[] = []

      for (const portLabel of pinLabelsFlatArray) {
        if (combinedProps[portLabel]) {
          const from = `.${name} > .${portLabel}`
          const to = combinedProps[portLabel]
          tracesToCreate.push({ from, to })
          delete combinedProps[portLabel]
        }
      }

      return (
        <>
          <Component {...combinedProps} />
          {tracesToCreate.map((trace, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            <trace key={i} {...trace} />
          ))}
        </>
      )
    }
    for (const port of pinLabelsFlatArray) {
      R[port] = `.${name} > .${port}`
    }

    return R
  }
}
