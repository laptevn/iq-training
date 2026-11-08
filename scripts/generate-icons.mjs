import sharp from 'sharp'

const jobs = [
  ['public/icons/icon.svg', 192, 'public/icons/icon-192.png'],
  ['public/icons/icon.svg', 512, 'public/icons/icon-512.png'],
  ['public/icons/icon.svg', 180, 'public/icons/apple-touch-icon.png'],
  ['public/icons/icon-maskable.svg', 512, 'public/icons/icon-maskable-512.png'],
]

await Promise.all(jobs.map(([source, size, output]) => sharp(source)
  .resize(size, size)
  .png({ compressionLevel: 9 })
  .toFile(output)))

console.log(`Generated ${jobs.length} PWA icons.`)
