import { z } from 'zod'

const railIndexSchema = z.number().nonnegative().max(6)
const playerSchema = z.object({
  id: z.string(),
  life: z.number(),
})
const cardSchema = z.object({
  id: z.string(),
  type: z.string(),
})
const cardTypeSchema = z.union([
  z.literal('yolo'),
  z.literal('galaxyBrain'),
  z.literal('openSourcerer'),
  z.literal('refactoring'),
  z.literal('pairExtraordinaire'),
  z.literal('lgtm'),
  z.literal('pullShark'),
  z.literal('starstruck'),
  z.literal('none'),
])

export const wsReceiveSchema = z
  .union([
    z.object({
      type: z.literal('connected'),
      body: z.object({
        playerId: z.string(),
        // TODO: player ids 降ってこなそうなの聞く
      }),
    }),
    z.object({
      type: z.literal('gameStarted'),
      body: z.object({
        players: z.array(playerSchema),
        cards: z.array(cardSchema),
      }),
    }),
    z.object({
      type: z.literal('lifeChanged'),
      body: z.object({
        playerId: z.string(),
        cardType: cardTypeSchema.nullable(),
        newLife: z.number().nonnegative().max(100),
      }),
    }),
    z.object({
      type: z.literal('railCreated'),
      body: z.object({
        newRail: railIndexSchema,
        parentRail: railIndexSchema,
        attackerId: z.string(),
        targetId: z.string(),
        cardType: cardTypeSchema,
      }),
    }),
    z.object({
      type: z.literal('railMerged'),
      body: z.object({
        childRail: railIndexSchema,
        parentRail: railIndexSchema,
        playerId: z.string(),
        cardType: cardTypeSchema,
      }),
    }),
    z.object({
      type: z.literal('blockCreated'),
      body: z.object({
        attackerId: z.string(),
        targetId: z.string(),
        cardType: cardTypeSchema,
        railIndex: railIndexSchema,
        delay: z.number(),
        attack: z.number(),
      }),
    }),
    z.object({
      type: z.literal('blockCanceled'),
      body: z.object({
        targetId: z.string(),
        rail: railIndexSchema,
        cardType: cardTypeSchema.nullable(),
      }),
    }),
    z.object({
      type: z.literal('blockCrashed'),
      body: z.object({
        targetId: z.string(),
        rail: railIndexSchema,
        cardType: cardTypeSchema.nullable(),
      }),
    }),
    z.object({
      type: z.literal('gameOverred'),
      body: z.object({
        playerId: z.string(),
      }),
    }),
  ])
  .and(
    z.object({
      // format: 0001-01-01T00:00:00Z
      eventTime: z.string().transform((z) => new Date(z).getTime()),
    }),
  )
export type WsReceive = z.infer<typeof wsReceiveSchema>
export const wsSendSchema = z.union([
  z.object({
    type: z.literal('gameStartEvent'),
    body: z.object({}),
  }),
  z.object({
    type: z.literal('lifeEvent'),
    body: z.object({
      type: z.union([z.literal('damaged'), z.literal('heal')]),
      diff: z.number(),
    }),
  }),
  z.object({
    type: z.literal('cardEvent'),
    body: z.object({
      id: z.string(),
      targetId: z.string(),
      type: cardTypeSchema,
    }),
  }),
  z.object({
    type: z.literal('blockEvent'),
    body: z.object({
      type: z.union([z.literal('canceled'), z.literal('crashed')]),
      cardType: cardTypeSchema.nullable(),
      railIndex: railIndexSchema,
    }),
  }),
])
export type WsSend = z.infer<typeof wsSendSchema>
