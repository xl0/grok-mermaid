import { render } from '../src/index.ts'

/** Rendered plain art as one string, the shape most assertions want. */
export function plain(src: string): string {
  const art = render(src)
  if (art === null) throw new Error('render drew nothing for this source')
  return art.plain.join('\n')
}

export const lines = (src: string): string[] => plain(src).split('\n')

/** Index of the first line containing `needle`; throws if absent. */
export function rowOf(art: string, needle: string): number {
  const i = art.split('\n').findIndex((l) => l.includes(needle))
  if (i === -1) throw new Error(`no line contains ${JSON.stringify(needle)}:\n${art}`)
  return i
}

export const countOf = (s: string, needle: string): number => s.split(needle).length - 1
