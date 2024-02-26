import { Coordinate } from "./Types/Coordinate"
import { Settings } from "./Types/SettingsTypes"
import { getFadedColorFromHex } from "./util"

type drawTextOnCanvasContextWithSettingsProps = {
    context: CanvasRenderingContext2D
    settings: Settings
    pos: Coordinate
    text: string
    zoom: number
    color?: string
    align?: CanvasTextAlign
}

export function drawTextOnCanvasContextWithSettings({ context, settings, pos, text, zoom, color, align }: drawTextOnCanvasContextWithSettingsProps) {
    if (zoom < settings.displayOptions.textVisibilityZoomThreshold - 0.5) return
    let alpha = 1
    if (zoom < settings.displayOptions.textVisibilityZoomThreshold) {
        alpha = zoom - (settings.displayOptions.textVisibilityZoomThreshold - 0.5)
        alpha = Math.max(0, alpha)
    }
    if (alpha < 0.1) return
    const { fontWeight, fontSize, fontFamily, fontColor } = settings.textSettings
    context.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    context.fillStyle = getFadedColorFromHex({ hexColor: color ?? fontColor, amount: alpha })
    context.textAlign = align ?? "center"
    context.fillText(text, pos.x, pos.y)
}
