import { VisibleCanvasArea } from "./GraphManager"
import { Coordinate } from "./Types/Coordinate"

export function genId(length = 10) {
    let id = ""
    const characters = "0123456789abcdefghijklmnopqrstuvwxyz"
    for (let i = 0; i < length; i++) {
        id = id + characters[Math.floor(characters.length * Math.random())]
    }
    return id
}

export function arraysEqualById(a: any[], b: any[]): boolean {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
        if (a[i].id !== b[i].id) return false
    }
    return true
}

export function getFadedColorFromHex({ hexColor, amount }: { hexColor: string; amount: number }) {
    const r = parseInt(hexColor.slice(1, 3), 16),
        g = parseInt(hexColor.slice(3, 5), 16),
        b = parseInt(hexColor.slice(5, 7), 16)

    return `rgba(${r}, ${g}, ${b}, ${amount})` // Use 'amount' directly as opacity
}

type BoundingBox = {
    x1: number
    x2: number
    y1: number
    y2: number
}

export function isElementVisible({ boundingBox, visibleCanvasArea }: { boundingBox: BoundingBox; visibleCanvasArea: VisibleCanvasArea }) {
    const { minX, maxX, minY, maxY } = visibleCanvasArea
    return boundingBox.x1 <= maxX && boundingBox.x2 >= minX && boundingBox.y1 <= maxY && boundingBox.y2 >= minY
}

export function getBoundingBoxForLine(startPos: Coordinate, endPos: Coordinate) {
    return {
        x1: Math.min(startPos.x, endPos.x),
        x2: Math.max(startPos.x, endPos.x),
        y1: Math.min(startPos.y, endPos.y),
        y2: Math.max(startPos.y, endPos.y),
    }
}

export function getBoundingBoxForCircle(position: Coordinate, radius: number) {
    return {
        x1: position.x - radius,
        x2: position.x + radius,
        y1: position.y - radius,
        y2: position.y + radius,
    }
}
