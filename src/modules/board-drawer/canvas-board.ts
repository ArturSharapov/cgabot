import { Canvas, Image, NodeCanvasRenderingContext2D } from 'canvas'
import * as tinycolor from 'tinycolor2'

const squareColors = { light: '#cac9c9', dark: '#a4a2a2', check: '#272522' } as const
export const zombieColors = {
  rando: '#ffffff',
  ranter: '#916e66',
  comfuter: '#874739',
  patzer: '#396b53',
  pusher: '#575880',
  checker: '#916841',
  muncher: '#d4c677',
  pusher_comfuter: '#444860',
  checker_comfuter: '#615838',
  muncher_comfuter: '#b4c657',
} as const
export const wallColor = '#211f1c'
const borderSize = 0.4
const borderColor = '#1e1c1a'

export const pieceColors = ['#c0353e', '#2f7dc1', '#c08d21', '#429459']
pieceColors.push(...pieceColors.map((color) => tinycolor(color).darken(20).toHexString()))
pieceColors.unshift('#8c8a88')

const transformToZombieType = (zombieTypeString: string) => {
  return zombieTypeString in zombieColors ? (zombieTypeString as keyof typeof zombieColors) : 'rando'
}

export class CanvasBoard {
  private canvas: Canvas
  private context: NodeCanvasRenderingContext2D
  private square = 0

  constructor(size: number) {
    this.square = Math.trunc(size / (14 + borderSize * 2))
    this.canvas = new Canvas(this.square * 14, this.square * 14)
    this.context = this.canvas.getContext('2d')
    for (let i = 0; i < 14; i++) {
      for (let j = 0; j < 14; j++) {
        this.context.fillStyle = (i + j) % 2 ? squareColors.dark : squareColors.light // or squareColors.check ??
        this.context.fillRect(i * this.square, j * this.square, this.square, this.square)
      }
    }
  }

  createImage(src: Image | undefined, x: number, y: number) {
    if (!src) {
      console.error('Invalid image (unknown piece)')
      return
    }
    this.context.drawImage(src, this.square * (x - 1), this.square * (y - 1), this.square, this.square)
  }

  indicateZombie(zombieTypeString: string, x: number, y: number) {
    const zombieType = transformToZombieType(zombieTypeString)
    this.context.beginPath()
    const gradient = this.context.createRadialGradient(
      this.square * (x - 0.5),
      this.square * (y - 0.5),
      this.square * 0.5,
      this.square * (x - 0.5 + 0.6),
      this.square * (y - 0.5 - 0.6),
      this.square * 0.2,
    )
    gradient.addColorStop(0.04, zombieColors[zombieType])
    gradient.addColorStop(0.9, '#ffffff00')
    this.context.fillStyle = gradient
    this.context.arc(this.square * (x - 0.5), this.square * (y - 0.5), this.square * 0.5, 0, 2 * Math.PI)
    this.context.fill()
  }

  indicateZombieImmune(zombieTypeString: string, x: number, y: number) {
    const zombieType = transformToZombieType(zombieTypeString)
    for (let i = 0; i <= 1; i++) {
      const gradient = this.context.createLinearGradient(
        this.square * (x - 1) * i,
        this.square * (y - 1) * (1 - i),
        this.square * x * i,
        this.square * y * (1 - i),
      )
      gradient.addColorStop(0.05, zombieColors[zombieType])
      gradient.addColorStop(0.2, zombieColors[zombieType] + '00')
      gradient.addColorStop(0.8, zombieColors[zombieType] + '00')
      gradient.addColorStop(0.95, zombieColors[zombieType])
      this.context.fillStyle = gradient
      this.context.fillRect(this.square * (x - 1), this.square * (y - 1), this.square, this.square)
    }
    this.context.strokeStyle = '#413e3e'
    this.context.lineWidth = this.square / 62.5
    this.context.strokeRect(this.square * (x - 1) + 1.25, this.square * (y - 1) + 1.25, this.square - 2.5, this.square - 2.5)
  }

  indicateNCheck(n: number, x: number, y: number) {
    this.context.fillStyle = '#ffffffbf'
    this.context.font = `bold ${this.square / 1.47}px "Segoe UI"`
    this.context.textAlign = 'center'
    this.context.fillText(n.toString(), this.square * (x - 0.5), this.square * (y - 0.245))
  }

  createKOTH() {
    for (let i = 0; i <= 1; i++) {
      const gradient = this.context.createLinearGradient(
        this.square * 6 * i,
        this.square * 6 * (1 - i),
        this.square * (6 + 2) * i,
        this.square * (6 + 2) * (1 - i),
      )
      gradient.addColorStop(0, '#00000055')
      gradient.addColorStop(0.11, '#00000000')
      gradient.addColorStop(0.89, '#00000000')
      gradient.addColorStop(1, '#00000055')
      this.context.fillStyle = gradient
      this.context.fillRect(this.square * 6, this.square * 6, this.square * 2, this.square * 2)
    }
    this.context.lineWidth = this.square * 0.04
    for (let j = 0; j <= 1; j++) {
      this.context.strokeStyle = j ? squareColors.dark : squareColors.light
      this.context.beginPath()
      for (let i = 0; i <= 1; i++) {
        this.context.moveTo(this.square * (6 + i * 2), this.square * 7)
        this.context.lineTo(this.square * (6 + i * 2), this.square * (6 + (j + (-1) ** j * i) * 2))
        this.context.lineTo(this.square * 7, this.square * (6 + (j + (-1) ** j * i) * 2))
      }
      this.context.stroke()
    }
  }

  createRacing(dim: [number, number]) {
    const racingX = (14 - dim[0]) / 2
    const racingY = (14 - dim[1]) / 2
    const racingW = dim[0]
    for (let i = 0; i <= 1; i++) {
      const gradient = this.context.createLinearGradient(
        this.square * racingX * i,
        this.square * racingY * (1 - i),
        this.square * (racingX + racingW) * i,
        this.square * (racingY + 1) * (1 - i),
      )
      gradient.addColorStop(0, '#00000077')
      gradient.addColorStop(0.15 / (i ? racingW * 1.1 : 1), '#00000000')
      gradient.addColorStop(1 - 0.15 / (i ? racingW * 1.1 : 1), '#00000000')
      gradient.addColorStop(1, '#00000077')
      this.context.fillStyle = gradient
      this.context.fillRect(this.square * racingX, this.square * racingY, this.square * racingW, this.square * 1)
    }
  }

  generateDataURL() {
    const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height)
    this.canvas.width += this.square * borderSize * 2
    this.canvas.height += this.square * borderSize * 2
    this.context.fillStyle = wallColor
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.context.lineWidth = 1
    this.context.strokeStyle = borderColor
    this.context.strokeRect(0, 0, this.canvas.width, this.canvas.height)
    this.context.putImageData(imageData, this.square * borderSize, this.square * borderSize)
    return this.canvas.toDataURL()
  }

  indicateRoyal(src: Image, x: number, y: number) {
    this.context.drawImage(
      src,
      Math.ceil(this.square * (x - 1 + 0.5)),
      Math.ceil(this.square * (y - 1 + 0.5)),
      Math.trunc(this.square * 0.4),
      Math.trunc(this.square * 0.4),
    )
  }

  // [OLD]
  // indicateRoyalOld(x: number, y: number, colorIndex: number) {
  //   const gradient = this.context.createRadialGradient(
  //     this.square * (x - 0.5),
  //     this.square * (y - 0.5),
  //     this.square,
  //     this.square * (x - 0.5),
  //     this.square * (y - 0.5),
  //     this.square * 0.3,
  //   )
  //   gradient.addColorStop(0.4, pieceColors[colorIndex])
  //   gradient.addColorStop(0.99, pieceColors[colorIndex] + '00')
  //   this.context.fillStyle = gradient
  //   this.fillRoundRect(this.square * (x - 1), this.square * (y - 1), this.square, this.square, this.square * 0.37)
  // }

  indicateRoyalZombie(x: number, y: number, zombieTypeString: string) {
    const zombieType = transformToZombieType(zombieTypeString)
    const gradient = this.context.createRadialGradient(
      this.square * (x - 0.5),
      this.square * (y - 0.5),
      this.square,
      this.square * (x - 0.5 + 0.6),
      this.square * (y - 0.5 - 0.6),
      this.square * 0.1,
    )
    gradient.addColorStop(0.3, zombieColors[zombieType])
    gradient.addColorStop(0.99, '#ffffff00')
    this.context.fillStyle = gradient
    this.fillRoundRect(this.square * (x - 1), this.square * (y - 1), this.square, this.square, this.square * 0.37)
  }

  private fillRoundRect(x: number, y: number, width: number, height: number, radius: number) {
    this.context.beginPath()
    this.context.moveTo(x + radius, y)
    this.context.lineTo(x + width - radius, y)
    this.context.quadraticCurveTo(x + width, y, x + width, y + radius)
    this.context.lineTo(x + width, y + height - radius)
    this.context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    this.context.lineTo(x + radius, y + height)
    this.context.quadraticCurveTo(x, y + height, x, y + height - radius)
    this.context.lineTo(x, y + radius)
    this.context.quadraticCurveTo(x, y, x + radius, y)
    this.context.closePath()
    this.context.fill()
  }
}
