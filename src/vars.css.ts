import { createVar, globalStyle } from '@vanilla-extract/css'

export const InShadow = createVar()
globalStyle(':root', {
  vars: {
    [InShadow]: 'inset 0 0 4px rgba(0, 0, 0, 0.35)',
  },
})
