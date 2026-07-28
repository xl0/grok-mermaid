import { expect, test } from 'bun:test'
import { computeRanks, countCrossings, orderRanks } from '../src/layout.ts'
import { parseGraph } from '../src/parse.ts'

function orderedRanks(src: string) {
  const g = parseGraph(src)
  if (g === null) throw new Error('parseGraph returned null')
  const ranks = computeRanks(g)
  const byRank: number[][] = Array.from({ length: Math.max(...ranks) + 1 }, () => [])
  for (let i = 0; i < ranks.length; i++) byRank[ranks[i]].push(i)
  orderRanks(byRank, g.edges, ranks)

  const pos = new Array<number>(g.nodes.length).fill(0)
  for (const row of byRank) {
    for (let i = 0; i < row.length; i++) pos[row[i]] = i
  }
  const at = (id: string): number => {
    const i = g.index.get(id)
    if (i === undefined) throw new Error(`no node ${id}`)
    return i
  }
  return { g, ranks, byRank, pos, at, crossings: () => countCrossings(g.edges, ranks, pos) }
}

test('ranks ignore back edges', () => {
  const { ranks, at } = orderedRanks('graph TD\n A-->B\n B-->C\n C-->A')
  expect(ranks[at('A')]).toBe(0)
  expect(ranks[at('B')]).toBe(1)
  expect(ranks[at('C')]).toBe(2)
})

test('orderRanks removes an avoidable crossing', () => {
  const { pos, at, crossings } = orderedRanks('graph TD\n C[ccc]\n D[ddd]\n A --> D\n B --> C')
  expect(crossings()).toBe(0)
  expect(pos[at('D')]).toBeLessThan(pos[at('C')])
})

test('orderRanks keeps an already crossing-free order', () => {
  const { byRank, at, crossings } = orderedRanks('graph TD\n A --> C\n B --> D')
  expect(byRank[0]).toEqual([at('A'), at('B')])
  expect(byRank[1]).toEqual([at('C'), at('D')])
  expect(crossings()).toBe(0)
})

test('a three-layer weave untangles', () => {
  const { crossings } = orderedRanks(
    'graph TD\n X[x]\n Y[y]\n A --> Y\n B --> X\n X --> Q\n Y --> P\n P[p]\n Q[q]',
  )
  expect(crossings()).toBe(0)
})
