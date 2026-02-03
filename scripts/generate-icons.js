/**
 * Generate PWA icons
 * Run: node scripts/generate-icons.js
 * Requires: npm install sharp (dev dependency)
 */

const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const ICONS_DIR = path.join(__dirname, '../public/icons')

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true })
}

// Simple lightbulb icon as SVG
const createIconSvg = (size, maskable = false) => {
  const padding = maskable ? size * 0.1 : 0
  const iconSize = size - padding * 2
  const offset = padding

  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#18181b"/>
      <g transform="translate(${offset}, ${offset})">
        <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 21h6M12 3a6 6 0 0 0-6 6c0 2.22 1.21 4.16 3 5.19V17a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2.81c1.79-1.03 3-2.97 3-5.19a6 6 0 0 0-6-6z"
            stroke="#fbbf24"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="#fbbf24"
            fill-opacity="0.2"
          />
        </svg>
      </g>
    </svg>
  `
}

async function generateIcons() {
  const sizes = [192, 512]

  for (const size of sizes) {
    // Regular icon
    const regularSvg = Buffer.from(createIconSvg(size, false))
    await sharp(regularSvg)
      .png()
      .toFile(path.join(ICONS_DIR, `icon-${size}.png`))
    console.log(`Created icon-${size}.png`)

    // Maskable icon (with safe zone padding)
    const maskableSvg = Buffer.from(createIconSvg(size, true))
    await sharp(maskableSvg)
      .png()
      .toFile(path.join(ICONS_DIR, `icon-maskable-${size}.png`))
    console.log(`Created icon-maskable-${size}.png`)
  }

  // Apple touch icon (180x180)
  const appleSvg = Buffer.from(createIconSvg(180, false))
  await sharp(appleSvg)
    .png()
    .toFile(path.join(ICONS_DIR, `apple-touch-icon.png`))
  console.log('Created apple-touch-icon.png')

  // Favicon (32x32)
  const faviconSvg = Buffer.from(createIconSvg(32, false))
  await sharp(faviconSvg)
    .png()
    .toFile(path.join(ICONS_DIR, `favicon-32x32.png`))
  console.log('Created favicon-32x32.png')

  // Also create favicon.ico alternative as PNG
  const favicon16Svg = Buffer.from(createIconSvg(16, false))
  await sharp(favicon16Svg)
    .png()
    .toFile(path.join(ICONS_DIR, `favicon-16x16.png`))
  console.log('Created favicon-16x16.png')

  console.log('\nAll icons generated!')
}

generateIcons().catch(console.error)
