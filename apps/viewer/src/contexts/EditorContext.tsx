import type { Renderer, types } from "@grx/engine"
import type { ContextMenuItemOptions } from "mantine-contextmenu"
import React from "react"

export interface EditorContext {
  renderer: Renderer
  project: {
    name: string
    stepName: string
  }
  units: types.Units
  setUnits: React.Dispatch<React.SetStateAction<types.Units>>
}

export const EditorConfigProvider = React.createContext<EditorContext>(null as unknown as EditorContext)

export const menuItemsBase: ContextMenuItemOptions[] = []

// TODO: Proxy-based array deduplication is a non-standard React pattern — mutations are implicit and hard to debug.
// Consider replacing with a proper state management approach.
export const menuItems = new Proxy(menuItemsBase, {
  get(target, prop): ContextMenuItemOptions | ((...t: ContextMenuItemOptions[]) => number) {
    if (prop === "push") {
      return (...args): number => {
        if (target.find((item) => item.key === args[0].key)) {
          target = target.filter((item) => item.key !== args[0].key)
        }
        return target[prop](...args)
      }
    }
    return target[prop]
  },
})
