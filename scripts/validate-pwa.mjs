import { access, readFile } from 'node:fs/promises'
import sharp from 'sharp'

const manifest = JSON.parse(await readFile('public/manifest.webmanifest', 'utf8'))
const failures = []

if (manifest.display !== 'standalone') failures.push('Manifest display must be standalone')
if (manifest.start_url !== './' || manifest.scope !== './') failures.push('Manifest URLs must support a GitHub Pages subpath')
if (!manifest.icons?.some((icon) => icon.purpose === 'maskable')) failures.push('Manifest is missing a maskable icon')

const expectedIcons = [
  ['public/icons/icon-192.png', 192],
  ['public/icons/icon-512.png', 512],
  ['public/icons/icon-maskable-512.png', 512],
  ['public/icons/apple-touch-icon.png', 180],
]

for (const [path, size] of expectedIcons) {
  await access(path)
  const metadata = await sharp(path).metadata()
  if (metadata.width !== size || metadata.height !== size) failures.push(`${path} must be ${size}×${size}`)
}

await Promise.all(['public/sw.js', 'public/offline.html', 'public/icons/icon.svg'].map((path) => access(path)))

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Validated PWA manifest, offline shell, and install icons.')
