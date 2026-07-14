
export const MOVE_TYPES = [

  "Household",

  "Office",

  "Commercial",

  "Vehicle"

] as const

export type MoveType =
typeof MOVE_TYPES[number]

