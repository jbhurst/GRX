import { createSpotlight, type SpotlightActionData, type SpotlightState } from "@mantine/spotlight"
import type { MantineStore } from "@mantine/store"

export const [spotlightStore, spotlight]: readonly [MantineStore<SpotlightState>, { open: () => void; close: () => void; toggle: () => void }] =
  createSpotlight()

export const actionsBase: SpotlightActionData[] = []

// TODO: Proxy-based array deduplication is a non-standard React pattern — mutations are implicit and hard to debug.
// Consider replacing with a proper state management approach.
export const actions = new Proxy(actionsBase, {
  get(target, prop): SpotlightActionData | ((...t: SpotlightActionData[]) => number) {
    if (prop === "push") {
      return (...args): number => {
        if (target.find((item) => item.id === args[0].id)) {
          target = target.filter((item) => item.id !== args[0].id)
        }
        return target[prop](...args)
      }
    }
    return target[prop]
  },
})
