import { Node, NodeActionState } from "./Node"
import { GraphManager } from "./GraphManager"
import { LinkGraphData } from "./LinkGraphData"
import { Coordinate } from "./Types/Coordinate"
import { arraysEqualById } from "./util"
import { Link, LinkActionState } from "./Link"

export class InteractionController extends LinkGraphData {
    graphManager: GraphManager
    canvas: HTMLCanvasElement
    isDragging: boolean = false
    lastCanvasMousePosition: Coordinate | null = null
    lastRawMousePosition: Coordinate | null = null
    startDragPosition: Coordinate | null = null
    lastClickTime: number | null = null
    hoveredLink: Link | null = null

    constructor(props: LinkGraphData & { graphManager: GraphManager }) {
        super(props)
        this.graphManager = props.graphManager
        this.canvas = this.graphManager.canvas
        this.initializeEventListeners()
    }

    initializeEventListeners() {
        this.canvas.addEventListener("wheel", this.handleZoom.bind(this))
        this.canvas.addEventListener("mousedown", this.startDrag.bind(this))
        this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this))
        this.canvas.addEventListener("mouseup", this.endDrag.bind(this))
        this.canvas.addEventListener("mouseleave", this.endDrag.bind(this))
        window.addEventListener("resize", this.linked.updateCanvasSize)
    }

    handleMouseMove(event: MouseEvent) {
        const canvasMousePos = this.getCanvasMousePosition(event)
        const rawMousePos = { x: event.clientX, y: event.clientY }

        this.handleHover(canvasMousePos)
        if (this.isDragging) this.dragOrPan(canvasMousePos, rawMousePos)

        this.lastCanvasMousePosition = canvasMousePos
        this.lastRawMousePosition = rawMousePos
    }

    handleHover(canvasMousePos?: Coordinate) {
        const savePos = canvasMousePos ?? this.lastCanvasMousePosition
        if (!savePos) return
        const hoveredNodes = this.findNodesAtPosition(savePos)
        if (!arraysEqualById(hoveredNodes, this.linked.hoveredNodes)) {
            this.linked.hoveredNodes.forEach((node) => node.stopAction(NodeActionState.HOVERED))
            this.linked.update("hoveredNodes", hoveredNodes)
            this.linked.settings.actionCallbacks.nodesHovered?.(hoveredNodes)
            hoveredNodes.forEach((node) => {
                node.startAction(NodeActionState.HOVERED)
            })
        }
        const hoveredLink = this.findLinkAtPosition(savePos)
        if (hoveredLink !== this.hoveredLink) {
            this.hoveredLink?.stopAction(LinkActionState.HOVERED)
            hoveredLink?.startAction(LinkActionState.HOVERED)
            this.linked.settings.actionCallbacks.linkHovered?.(hoveredLink)
            this.hoveredLink = hoveredLink
        }
    }

    dragOrPan(canvasMousePos: Coordinate, rawMousePos: Coordinate) {
        if (this.linked.draggedNode && this.lastCanvasMousePosition) {
            // Use last canvas position for dragging calculations
            const dx = canvasMousePos.x - this.lastCanvasMousePosition.x
            const dy = canvasMousePos.y - this.lastCanvasMousePosition.y
            this.linked.draggedNode.position.x += dx
            this.linked.draggedNode.position.y += dy
        } else if (this.lastRawMousePosition) {
            // Use last raw position for canvas panning
            this.linked.update("positionOffset", {
                x: this.linked.positionOffset.x + rawMousePos.x - this.lastRawMousePosition.x,
                y: this.linked.positionOffset.y + rawMousePos.y - this.lastRawMousePosition.y,
            })
        }
    }

    debugDisplay(context: CanvasRenderingContext2D) {
        context.beginPath()
        context.arc(this.lastCanvasMousePosition?.x ?? 0, this.lastCanvasMousePosition?.y ?? 0, 5, 0, 2 * Math.PI)
        context.fillStyle = "red"
        context.fill()
    }

    handleZoom(event: WheelEvent) {
        event.preventDefault()
        const zoomIntensity = 0.02
        const scaleFactor = event.deltaY > 0 ? 1 - zoomIntensity : 1 + zoomIntensity
        this.linked.update("zoom", Math.min(Math.max(0.05, this.linked.zoom * scaleFactor), 20))

        const rect = this.canvas.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        this.linked.update("positionOffset", {
            x: this.linked.positionOffset.x + (mouseX - this.linked.positionOffset.x) * (1 - scaleFactor),
            y: this.linked.positionOffset.y + (mouseY - this.linked.positionOffset.y) * (1 - scaleFactor),
        })
    }

    startDrag(event: MouseEvent) {
        this.isDragging = true
        this.lastCanvasMousePosition = this.getCanvasMousePosition(event)
        this.startDragPosition = this.lastCanvasMousePosition
        this.lastRawMousePosition = { x: event.clientX, y: event.clientY }
        this.linked.draggedNode = this.findNodeAtPosition(this.lastCanvasMousePosition)
        this.linked.draggedNode?.startAction(NodeActionState.DRAGGED)
    }

    endDrag(event: MouseEvent) {
        const endDragPosition = this.getCanvasMousePosition(event)
        if (this.startDragPosition) this.handleClick(this.startDragPosition, endDragPosition)

        if (this.linked.draggedNode) {
            const allDropLocationNodes = this.findNodesAtPosition(endDragPosition)
            const targetNodes = allDropLocationNodes.filter((node) => node !== this.linked.draggedNode)

            if (targetNodes.length !== 0) this.linked.settings.actionCallbacks.nodeDroppedOnNodes?.(this.linked.draggedNode, targetNodes)

            this.linked.draggedNode.stopAction(NodeActionState.DRAGGED)
        }

        this.isDragging = false
        this.linked.draggedNode = null
        this.lastCanvasMousePosition = null
        this.lastRawMousePosition = null
    }

    handleClick(startDragPosition: Coordinate, endDragPosition: Coordinate) {
        const currentTime = Date.now()
        const doubleClickDelay = 300
        const isDoubleClick = this.lastClickTime && currentTime - this.lastClickTime <= doubleClickDelay
        const isClick = !isDoubleClick && Math.abs(endDragPosition.x - startDragPosition.x) <= 5 && Math.abs(endDragPosition.y - startDragPosition.y) <= 5

        if (isClick || isDoubleClick) {
            const clickedNode = this.findNodeAtPosition(endDragPosition)

            if (isDoubleClick && clickedNode) {
                this.linked.settings.actionCallbacks.nodeDoubleClicked?.(clickedNode)
            } else if (isClick && clickedNode) {
                this.linked.settings.actionCallbacks.nodeClicked?.(clickedNode)
            }

            const clickedLink = this.findLinkAtPosition(endDragPosition)
            if (isDoubleClick && clickedLink) {
                this.linked.settings.actionCallbacks.linkDoubleClicked?.(clickedLink)
            } else if (isClick && clickedLink) {
                this.linked.settings.actionCallbacks.linkClicked?.(clickedLink)
            }
        }

        if (!isDoubleClick) this.lastClickTime = currentTime

        this.startDragPosition = null
    }

    getCanvasMousePosition(event: MouseEvent): Coordinate {
        const rect = this.canvas.getBoundingClientRect()
        // Account for CSS scaling
        const scaleX = this.canvas.width / rect.width
        const scaleY = this.canvas.height / rect.height
        return {
            x: ((event.clientX - rect.left) * scaleX - this.linked.positionOffset.x) / this.linked.zoom,
            y: ((event.clientY - rect.top) * scaleY - this.linked.positionOffset.y) / this.linked.zoom,
        }
    }

    findNodesAtPosition(pos: Coordinate): Node[] {
        return this.graphManager.nodes.filter((node) => node.isPointInside(pos))
    }

    findNodeAtPosition(pos: Coordinate): Node | null {
        return this.graphManager.nodes.find((node) => node.isPointInside(pos)) ?? null
    }

    findLinkAtPosition(pos: Coordinate): Link | null {
        return this.graphManager.links.find((link) => link.isPointInside(pos)) ?? null
    }
}
