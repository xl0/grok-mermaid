/**
 * Cuts a release: rolls the changelog over, bumps `package.json`, verifies,
 * commits, tags and pushes.
 *
 *   bun run release [patch|minor|major|x.y.z] [--no-push]
 *
 * The tag push is the trigger for `.github/workflows/publish.yml`, which
 * publishes to npm and creates the GitHub Release. `--no-push` stops at the tag
 * so the commit can be inspected first; nothing reaches npm until it is pushed.
 *
 * Writing changelog entries is `/cl`'s job, not this script's — everything here
 * is mechanical, which is what makes the unattended push at the end acceptable.
 */

import { $ } from 'bun'

const die = (msg: string): never => {
  console.error(msg)
  process.exit(1)
}

const parse = (v: string) => {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)$/)
  return m ? ([Number(m[1]), Number(m[2]), Number(m[3])] as const) : null
}

const cmp = (a: readonly number[], b: readonly number[]) =>
  a[0] - b[0] || a[1] - b[1] || a[2] - b[2]

const args = process.argv.slice(2)
const push = !args.includes('--no-push')
const target = args.find((arg) => !arg.startsWith('-')) ?? 'patch'

const branch = (await $`git rev-parse --abbrev-ref HEAD`.text()).trim()
if (branch !== 'master') die(`on ${branch}; releases are cut from master`)
if ((await $`git status --porcelain`.text()).trim()) die('worktree is dirty; commit or stash first')

const pkgText = await Bun.file('package.json').text()
const current = (JSON.parse(pkgText).version ?? '') as string
const cur = parse(current) ?? die(`package.json version ${current} is not semver`)

let version: string
if (target === 'patch') version = `${cur[0]}.${cur[1]}.${cur[2] + 1}`
else if (target === 'minor') version = `${cur[0]}.${cur[1] + 1}.0`
else if (target === 'major') version = `${cur[0] + 1}.0.0`
else {
  const explicit = parse(target) ?? die(`not a bump type or a semver version: ${target}`)
  if (cmp(explicit, cur) <= 0) die(`${target} is not greater than the current ${current}`)
  version = target
}

if ((await $`git tag -l ${`v${version}`}`.text()).trim()) die(`tag v${version} already exists`)

const onNpm = await $`npm view ${`grok-mermaid@${version}`} version`.nothrow().quiet()
if (onNpm.exitCode === 0 && onNpm.stdout.toString().trim())
  die(`${version} is already published to npm`)

// The [Unreleased] body runs to the next `## [` heading; refuse a release that
// would carry no entries rather than tagging an empty section.
const changelog = await Bun.file('CHANGELOG.md').text()
const heading = '## [Unreleased]'
const start = changelog.indexOf(heading)
if (start < 0) die('CHANGELOG.md has no [Unreleased] section')
const rest = changelog.slice(start + heading.length)
const nextHeading = rest.search(/^## \[/m)
if (!/^- /m.test(nextHeading < 0 ? rest : rest.slice(0, nextHeading)))
  die('[Unreleased] has no entries — run /cl first')

const date = new Date().toISOString().slice(0, 10)
await Bun.write(
  'CHANGELOG.md',
  changelog.replace(`${heading}\n`, `${heading}\n\n## [${version}] - ${date}\n`),
)

const bumped = pkgText.replace(`"version": "${current}"`, `"version": "${version}"`)
if (bumped === pkgText) die('could not rewrite the version in package.json')
await Bun.write('package.json', bumped)

console.log(`\n=== verifying ${version} ===\n`)
await $`bun run prepublishOnly`
await $`bun pm pack --dry-run`

console.log(`\n=== committing and tagging ${version} ===\n`)
await $`git add CHANGELOG.md package.json`
await $`git commit -m ${`chore(release): ${version}`}`
await $`git tag -a ${`v${version}`} -m ${`grok-mermaid ${version}`}`

if (!push) {
  console.log(`
Committed and tagged v${version}; nothing was pushed. Publish it with:

  git push origin master v${version}
`)
  process.exit(0)
}

console.log(`\n=== pushing ${version} ===\n`)
// --no-follow-tags: push exactly this release's tag, whatever push.followTags
// is set to locally. An older unpushed tag would otherwise trigger its own run.
await $`git push --no-follow-tags origin master`
await $`git push origin ${`v${version}`}`

console.log(`
Pushed v${version}. CI is publishing it to npm and creating the GitHub Release.
`)
