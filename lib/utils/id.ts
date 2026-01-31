import { nanoid } from 'nanoid'

export function generateId(size: number = 10): string {
  return nanoid(size)
}
