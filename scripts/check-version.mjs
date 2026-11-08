import { readFileSync } from 'node:fs'

const metadata = JSON.parse(readFileSync(new URL('../version.json', import.meta.url), 'utf8'))
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const cargo = readFileSync(new URL('../Cargo.toml', import.meta.url), 'utf8')
const history = readFileSync(new URL('../docs/BUILD_HISTORY.md', import.meta.url), 'utf8')
const android = readFileSync(new URL('../android/app/build.gradle', import.meta.url), 'utf8')

const required = ['applicationVersion', 'buildNumber', 'buildDate', 'releaseChannel', 'storageSchemaVersion', 'minimumCompatibleDataVersion']
for (const field of required) {
  if (metadata[field] === undefined || metadata[field] === '') throw new Error(`version.json is missing ${field}`)
}
if (packageJson.version !== metadata.applicationVersion) throw new Error('package.json must match version.json')
if (!cargo.includes(`version = "${metadata.applicationVersion}"`)) throw new Error('Cargo.toml must match version.json')
if (!android.includes(`versionName '${metadata.applicationVersion}'`) || !android.includes(`versionCode ${metadata.buildNumber}`)) throw new Error('Android version metadata must match version.json')
if (!history.includes(`## Run ${metadata.buildNumber} —`)) throw new Error('BUILD_HISTORY.md is missing the current run')
if (!['development', 'alpha', 'beta', 'stable'].includes(metadata.releaseChannel)) throw new Error('Invalid release channel')
console.log(`VERSION_CHECK PASS v${metadata.applicationVersion} build ${metadata.buildNumber} (${metadata.releaseChannel})`)
