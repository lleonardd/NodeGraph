import { Link } from "./Link"
import { genId } from "./util"
import { LinkGraphData } from "./LinkGraphData"
import { PhysicalMovingObject, PhysicalMovingObjectProps } from "./PhysicalMovableObject"
import { Coordinate } from "./Types/Coordinate"
import { drawTextOnCanvasContextWithSettings } from "./externalRenderingMethods"
import { resetHighlight, setHighlight } from "./HighlightController"

export type NodeProps = {
    id: string
    title: string
    size: number
    color: string
} & PhysicalMovingObjectProps

export enum NodeActionState {
    HOVERED = "hovered",
    CLICKED = "clicked",
    DRAGGED = "dragged",
    HIGHLIGHTED = "highlighted",
}

type NodeActionStatus = {
    [key in NodeActionState]: boolean
}

// needs to be a function to create a new object instance
const genEmptyNodeActionStatus = () =>
    ({
        hovered: false,
        clicked: false,
        dragged: false,
    } as NodeActionStatus)

export class Node extends PhysicalMovingObject {
    id: string
    title: string
    size: number
    color: string
    parents: Node[]
    children: Node[]
    links: Set<Link>
    actionStatus: NodeActionStatus = genEmptyNodeActionStatus()

    constructor(props: Partial<NodeProps> & LinkGraphData) {
        super(props)
        const { id, title } = props
        this.id = id ?? genId()
        this.title = title ?? ""
        this.size = props.size ?? this.linked.settings.displayOptions.defaultNodeSize
        this.color = props.color ?? this.linked.settings.displayOptions.defaultNodeColor
        this.parents = []
        this.children = []
        this.links = new Set<Link>()
    }

    draw({ context }: { context: CanvasRenderingContext2D }) {
        setHighlight({ context, highlightStatus: this.actionStatus.highlighted })
        context.beginPath()
        context.arc(this.position.x, this.position.y, this.size, 0, 2 * Math.PI)
        context.fillStyle = this.actionStatus.hovered ? this.linked.settings.displayOptions.defaultNodeHighlightColor : this.color
        context.fill()

        if (this.title) {
            drawTextOnCanvasContextWithSettings({
                context,
                settings: this.linked.settings,
                pos: { x: this.position.x, y: this.position.y + (this.size + this.linked.settings.textSettings.fontSize) },
                text: this.title,
                zoom: this.linked.zoom,
            })
        }
        resetHighlight({ context, highlightStatus: this.actionStatus.highlighted })
    }

    move(nodes: PhysicalMovingObject[]): void {
        super.move(nodes, Array.from(this.links), this.size * 3)
    }

    update(props: Partial<NodeProps>) {
        Object.entries(props).forEach(([key, value]) => {
            if (key in (this as Node) && value !== undefined) {
                ;(this as any)[key] = value
            }
        })
    }

    addLink(link: Link) {
        if (link.startNode === this) {
            this.parents.push(link.endNode)
        } else {
            this.children.push(link.startNode)
        }
        this.links.add(link)
    }

    isPointInside({ x, y }: Coordinate): boolean {
        const dx = x - this.position.x
        const dy = y - this.position.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        return distance <= this.size
    }

    getBrowserPosition(): Coordinate {
        return {
            x: this.position.x * this.linked.zoom + this.linked.positionOffset.x,
            y: this.position.y * this.linked.zoom + this.linked.positionOffset.y,
        }
    }

    startAction(state: NodeActionState) {
        this.actionStatus[state] = true
    }

    stopAction(state: NodeActionState) {
        this.actionStatus[state] = false
    }
}
