import { resetHighlight, setHighlight } from "./HighlightController"
import { LinkGraphData } from "./LinkGraphData"
import { Node } from "./Node"
import { Coordinate } from "./Types/Coordinate"
import { Settings } from "./Types/SettingsTypes"
import { drawTextOnCanvasContextWithSettings } from "./externalRenderingMethods"
import { getBoundingBoxForLine, isElementVisible } from "./util"

const arrowTipLengthMultiplier = 5

export type LinkProps = {
    startNode: Node | string
    endNode: Node | string
    color: string
    title: string
    bidirectional: boolean
    id: string
} & LinkGraphData

export enum LinkActionState {
    HOVERED = "hovered",
    CLICKED = "clicked",
    HIGHLIGHTED = "highlighted",
}

type LinkActionStatus = {
    [key in LinkActionState]: boolean
}

// needs to be a function to create a new object instance
const genEmptyLinkActionStatus = () =>
    ({
        hovered: false,
        clicked: false,
        highlighted: false,
    } as LinkActionStatus)

export class Link extends LinkGraphData {
    startNode: Node
    endNode: Node
    id: string
    color: string
    title?: string
    bidirectional: boolean
    actionStatus: LinkActionStatus = genEmptyLinkActionStatus()

    constructor(props: Partial<LinkProps> & { startNode: Node; endNode: Node } & LinkGraphData) {
        super(props)
        const { startNode, endNode, title, bidirectional = false, color, id } = props
        this.startNode = startNode
        this.endNode = endNode
        startNode.addLink(this)
        endNode.addLink(this)
        this.color = color ?? this.linked.settings.displayOptions.defaultLinkColor
        this.title = title
        this.bidirectional = bidirectional
        this.id = id ?? Link.buildLinkId(startNode.id, endNode.id)
    }

    static buildLinkId(startNodeId: string, endNodeId: string) {
        return [startNodeId, endNodeId].sort().join("")
    }

    update(props: Partial<LinkProps>) {
        Object.entries(props).forEach(([key, value]) => {
            if (key in (this as Link) && value !== undefined) {
                ;(this as any)[key] = value
            }
        })
    }

    remove() {
        this.startNode.removeLink(this)
        this.endNode.removeLink(this)
    }

    draw({ context }: { context: CanvasRenderingContext2D }) {
        const { startPos, endPos } = this.calculateModifiedPointsByNodeSize(this.startNode, this.endNode)
        const boundingBox = getBoundingBoxForLine(startPos, endPos)
        if (!isElementVisible({ boundingBox, visibleCanvasArea: this.linked.visibleCanvasArea })) return
        setHighlight({ context, highlightStatus: this.actionStatus.highlighted })

        context.beginPath()
        context.moveTo(startPos.x, startPos.y)
        context.lineTo(endPos.x, endPos.y)
        this.applyStyle(context)
        context.stroke()

        if (
            this.title &&
            ((this.actionStatus.hovered && this.linked.settings.displayOptions.showLinkTextOnHover) ||
                !this.linked.settings.displayOptions.showLinkTextOnHover ||
                (this.actionStatus.highlighted && this.linked.settings.displayOptions.showLinkTextOnHighlight))
        ) {
            drawTextOnCanvasContextWithSettings({
                context,
                settings: this.linked.settings,
                pos: { x: (startPos.x + endPos.x) / 2, y: (startPos.y + endPos.y) / 2 },
                text: this.title,
                zoom: this.linked.zoom,
            })
        }

        if (this.bidirectional && this.linked.settings.displayOptions.showArrows) {
            this.drawArrowTip(context, startPos, endPos, this.linked.settings)
            this.drawArrowTip(context, endPos, startPos, this.linked.settings)
        } else if (this.linked.settings.displayOptions.showArrows) {
            this.drawArrowTip(context, startPos, endPos, this.linked.settings)
        }
        resetHighlight({ context, highlightStatus: this.actionStatus.highlighted })
    }

    drawArrowTip(context: CanvasRenderingContext2D, fromPos: Coordinate, toPos: Coordinate, settings: Settings) {
        const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x)
        const tipLength = settings.displayOptions.defaultLinkThickness * arrowTipLengthMultiplier

        const adjustedToPos = {
            x: toPos.x + arrowTipLengthMultiplier * Math.cos(angle),
            y: toPos.y + arrowTipLengthMultiplier * Math.sin(angle),
        }

        this.applyStyle(context)

        context.beginPath()
        context.moveTo(adjustedToPos.x, adjustedToPos.y)
        context.lineTo(adjustedToPos.x - tipLength * Math.cos(angle - Math.PI / 6), adjustedToPos.y - tipLength * Math.sin(angle - Math.PI / 6))
        context.lineTo(adjustedToPos.x - tipLength * Math.cos(angle + Math.PI / 6), adjustedToPos.y - tipLength * Math.sin(angle + Math.PI / 6))
        context.closePath()
        context.fill()
    }

    applyStyle(context: CanvasRenderingContext2D) {
        context.lineWidth = this.linked.settings.displayOptions.defaultLinkThickness
        const currentColor = this.actionStatus.hovered ? this.linked.settings.displayOptions.defaultLinkHighlightColor : this.color
        context.strokeStyle = currentColor
        context.fillStyle = currentColor
    }

    calculateModifiedPointsByNodeSize(startNode: Node, endNode: Node, lineEndPadding = 0) {
        const angle = Math.atan2(endNode.position.y - startNode.position.y, endNode.position.x - startNode.position.x)
        const endArrowGap = this.linked.settings.displayOptions.showArrows ? arrowTipLengthMultiplier : 0
        const startArrowGap = endArrowGap && this.bidirectional ? endArrowGap : 0

        const modifiedStartPoint = {
            x: startNode.position.x + (startNode.size + startArrowGap + lineEndPadding) * Math.cos(angle),
            y: startNode.position.y + (startNode.size + startArrowGap + lineEndPadding) * Math.sin(angle),
        }

        const modifiedEndPoint = {
            x: endNode.position.x - (endNode.size + endArrowGap + lineEndPadding) * Math.cos(angle),
            y: endNode.position.y - (endNode.size + endArrowGap + lineEndPadding) * Math.sin(angle),
        }

        return { startPos: modifiedStartPoint, endPos: modifiedEndPoint }
    }

    startAction(state: LinkActionState) {
        this.actionStatus[state] = true
    }

    stopAction(state: LinkActionState) {
        this.actionStatus[state] = false
    }

    isPointInside(pos: Coordinate): boolean {
        const distance = this.pointNodeLineDistance(pos, this.startNode, this.endNode)

        return distance <= this.linked.settings.displayOptions.defaultLinkThickness
    }

    // https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
    pointNodeLineDistance(pointToCheck: Coordinate, startNode: Node, endNode: Node): number {
        const { startPos, endPos } = this.calculateModifiedPointsByNodeSize(startNode, endNode, this.linked.settings.displayOptions.defaultLinkThickness)

        const dx = endPos.x - startPos.x
        const dy = endPos.y - startPos.y
        const lineLengthSquared = dx * dx + dy * dy
        if (lineLengthSquared === 0) return Math.hypot(pointToCheck.x - startPos.x, pointToCheck.y - startPos.y)

        const t = ((pointToCheck.x - startPos.x) * dx + (pointToCheck.y - startPos.y) * dy) / lineLengthSquared
        const clampedT = Math.max(0, Math.min(1, t))
        const closestX = startPos.x + clampedT * dx
        const closestY = startPos.y + clampedT * dy

        return Math.hypot(pointToCheck.x - closestX, pointToCheck.y - closestY)
    }
}
