/**
 * Generates simple PNG icons for the PWA without external dependencies.
 * Run with: node scripts/generate-icons.mjs
 */
import { createWriteStream } from 'fs'
import { deflateSync } from 'zlib'
import { mkdirSync } from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function writePNG(width, height, pixels, outputPath) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR chunk
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // color type: RGB
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  // Raw image data (filter byte per row + RGB pixels)
  const rawRows = []
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3)
    row[0] = 0 // filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixels(x, y, width, height)
      row[1 + x * 3] = r
      row[1 + x * 3 + 1] = g
      row[1 + x * 3 + 2] = b
    }
    rawRows.push(row)
  }
  const rawData = Buffer.concat(rawRows)
  const compressed = deflateSync(rawData)

  function chunk(type, data) {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length, 0)
    const typeBytes = Buffer.from(type, 'ascii')
    const crcBuf = Buffer.concat([typeBytes, data])
    const crc = crc32(crcBuf)
    const crcBytes = Buffer.alloc(4)
    crcBytes.writeUInt32BE(crc >>> 0, 0)
    return Buffer.concat([len, typeBytes, data, crcBytes])
  }

  function crc32(buf) {
    const table = makeCRCTable()
    let crc = 0xFFFFFFFF
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF]
    }
    return (crc ^ 0xFFFFFFFF)
  }

  let crcTable = null
  function makeCRCTable() {
    if (crcTable) return crcTable
    crcTable = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
      }
      crcTable[n] = c
    }
    return crcTable
  }

  const png = Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])

  const stream = createWriteStream(outputPath)
  stream.write(png)
  stream.end()
  console.log(`Written: ${outputPath}`)
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

const BG = hexToRgb('#0f1117')
const SURFACE = hexToRgb('#1a1d27')
const ACCENT = hexToRgb('#c9a84c')
const WHITE = [255, 255, 255]

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
}

function lerp(a, b, t) {
  t = Math.max(0, Math.min(1, t))
  return [
    Math.round(a[0] * (1 - t) + b[0] * t),
    Math.round(a[1] * (1 - t) + b[1] * t),
    Math.round(a[2] * (1 - t) + b[2] * t),
  ]
}

function chipPixel(x, y, size) {
  const cx = size / 2
  const cy = size / 2
  const r = size / 2
  const d = dist(x, y, cx, cy)
  const aa = 1.5 // anti-alias width

  // Background fill
  let color = BG

  const outerRing = r * 0.875
  const innerFill = r * 0.729
  const dashRing = r * 0.729
  const center = r * 0.542

  // Outer ring (accent)
  const ringWidth = r * 0.083
  if (d > outerRing - ringWidth - aa && d < outerRing + aa) {
    const t = d > outerRing - ringWidth ? (outerRing - d + aa) / (aa * 2) : 1
    color = lerp(ACCENT, color, 1 - Math.max(0, Math.min(1, t + 0.3)))
    if (d <= outerRing && d >= outerRing - ringWidth) color = ACCENT
  }

  // Inner fill (surface)
  if (d < innerFill) {
    const t = (innerFill - d) / aa
    color = lerp(SURFACE, ACCENT, 1 - Math.max(0, Math.min(1, t)))
    if (d < innerFill - aa) color = SURFACE
  }

  // Dash ring pattern
  const dashRingWidth = r * 0.042
  if (d > dashRing - dashRingWidth && d < dashRing + dashRingWidth / 2) {
    const angle = Math.atan2(y - cy, x - cx)
    const dashCount = Math.round(size / 24)
    const sectorAngle = (Math.PI * 2) / dashCount
    const posInSector = ((angle + Math.PI) % sectorAngle) / sectorAngle
    if (posInSector < 0.55) {
      color = ACCENT
    }
  }

  // Center circle background
  if (d < center + aa) {
    const t = (d - (center - aa)) / (aa * 2)
    if (d < center - aa) color = BG
    else color = lerp(BG, SURFACE, t)
  }

  // Center ring border
  const centerBorder = r * 0.031
  if (d > center - centerBorder - aa && d < center + aa) {
    if (d >= center - centerBorder && d <= center) {
      color = ACCENT
    }
  }

  // Outside the chip circle → background
  if (d > r - aa) {
    if (d > r) color = BG
    else {
      const t = (d - (r - aa)) / aa
      color = lerp(color, BG, t)
    }
  }

  return color
}

function generateIcon(size, outputPath) {
  writePNG(size, size, (x, y) => chipPixel(x, y, size), outputPath)
}

mkdirSync(`${dirname(__dirname)}/public/icons`, { recursive: true })
generateIcon(192, `${dirname(__dirname)}/public/icons/icon-192.png`)
generateIcon(512, `${dirname(__dirname)}/public/icons/icon-512.png`)
