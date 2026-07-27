import { expect, test } from 'bun:test'
import { render } from '../src/index.ts'

test('blank source returns null', () => {
  expect(render('   \n  ')).toBeNull()
})
