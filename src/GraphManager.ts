import { Link, LinkProps } from "./Link"
import { Coordinate } from "./Types/Coordinate"
import { Settings, defaultActionCallbacks, defaultDisplayOptions, defaultForceParameters, defaultSettings, defaultTextSettings } from "./Types/SettingsTypes"
import { PhysicalMovingObjectProps } from "./PhysicalMovableObject"
import { NodeProps, Node } from "./Node"
import { InteractionController } from "./InteractionController"
import { AllPartial } from "./Types/utilTypes"
import { HighlightController, HighlightedElementsList, HighlightTraverseType, suppressForHighlights } from "./HighlightController"

type GraphManagerProps = {
    settings: AllPartial<Settings>
    canvas: HTMLCanvasElement
}

export type VisibleCanvasArea = { minX: number; maxX: number; minY: number; maxY: number }

export type SharedGraphManagerData = {
    settings: Settings
    zoom: number
    positionOffset: Coordinate
    canvasSize: Coordinate
    draggedNode: Node | null
    hoveredNodes: Node[]
    update: <K extends keyof SharedGraphManagerData>(key: K, value: SharedGraphManagerData[K]) => void
    updateCanvasSize: () => void
    highlightedElements: HighlightedElementsList
    visibleCanvasArea: VisibleCanvasArea
}

export class GraphManager {
    nodes: Map<string, Node>
    links: Map<string, Link>
    shared: SharedGraphManagerData
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D | null
    animationFrameId: number | null
    interactionController: InteractionController | null
    highlightController: HighlightController | null
    isMovementPaused: boolean

    constructor({ settings, canvas }: GraphManagerProps) {
        this.canvas = canvas
        this.context = canvas.getContext("2d")
        this.nodes = new Map()
        this.links = new Map()
        this.shared = {
            settings: defaultSettings,
            zoom: 1,
            positionOffset: { x: canvas.width / 2, y: canvas.height / 2 },
            canvasSize: { x: canvas.width, y: canvas.height },
            draggedNode: null,
            hoveredNodes: [] as Node[],
            highlightedElements: [] as HighlightedElementsList,
            update: this.updateSharedValue.bind(this),
            updateCanvasSize: this.updateCanvasSize.bind(this),
        } as SharedGraphManagerData
        this.updateCanvasSize()
        this.updateSettings(settings)
        this.animationFrameId = null
        this.interactionController = new InteractionController({
            graphManager: this,
            linked: this.shared,
        })
        this.highlightController = new HighlightController({ linked: this.shared })
        this.isMovementPaused = false
    }

    updateCanvasSize() {
        const rect = this.canvas.getBoundingClientRect()
        this.canvas.width = rect.width
        this.canvas.height = rect.height
        if (this.shared?.canvasSize) this.shared.canvasSize = { x: rect.width, y: rect.height }
        this.updateVisibleCanvasArea()
    }

    startAnimation() {
        if (!this.context) return
        const animate = () => {
            this.update()
            this.draw()
            this.animationFrameId = requestAnimationFrame(animate)
        }
        animate()
    }

    stopAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId)
            this.animationFrameId = null
        }
    }

    pauseMovement() {
        this.isMovementPaused = true
    }

    resumeMovement() {
        this.isMovementPaused = false
    }

    update() {
        if (!this.isMovementPaused) this.nodes.forEach((node) => node.move(this.nodes))
        this.interactionController?.handleHover()
    }

    draw() {
        this.context!.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.context!.save()
        this.context!.translate(this.shared.positionOffset.x, this.shared.positionOffset.y)
        this.context!.scale(this.shared.zoom, this.shared.zoom)
        suppressForHighlights({ context: this.context!, suppress: this.shared.highlightedElements.length > 0 })
        this.links.forEach((link) => link.draw({ context: this.context! }))
        this.nodes.forEach((node) => node.draw({ context: this.context! }))
        this.context!.restore()
    }

    addNode(props: Partial<NodeProps & PhysicalMovingObjectProps>) {
        const position = {
            x: (this.canvas.width + this.shared.positionOffset.x) * (0.5 - Math.random()),
            y: (this.canvas.height + this.shared.positionOffset.y) * (0.5 - Math.random()),
        }
        if (props?.id && !this.nodes.has(props?.id)) return null
        const newNode = new Node({ ...props, position, linked: this.shared })
        this.nodes.set(newNode.id, newNode)
        return newNode
    }

    addLink(props: Partial<LinkProps> & { startNodeOrId: LinkProps["startNode"]; endNodeOrId: LinkProps["endNode"] }) {
        const startNode = typeof props.startNodeOrId === "object" ? props.startNodeOrId : this.nodes.get(props.startNodeOrId)
        const endNode = typeof props.endNodeOrId === "object" ? props.endNodeOrId : this.nodes.get(props.endNodeOrId)
        if (!startNode || !endNode || startNode === endNode) return null

        const futureLinkId = props.id ?? Link.buildLinkId(startNode.id, endNode.id)
        if (this.links.has(futureLinkId)) this.updateLink(futureLinkId, props)

        const newLink = new Link({ ...props, startNode, endNode, linked: this.shared, bidirectional: props?.bidirectional })
        this.links.set(newLink.id, newLink)
        return newLink
    }

    updateNode(nodeOrNodeId: Node | string, props: Partial<NodeProps & PhysicalMovingObjectProps>) {
        const node = this.nodes.get(getSaveLinkOrNodeId(nodeOrNodeId))
        node?.update(props)
        return node
    }

    updateLink(linkOrLinkId: Link | string, props: Partial<LinkProps>) {
        const link = this.links.get(getSaveLinkOrNodeId(linkOrLinkId))
        link?.update(props)
        return link
    }

    removeNode(nodeOrNodeId: Node | string): void {
        const node = this.nodes.get(getSaveLinkOrNodeId(nodeOrNodeId))
        if (!node) return
        node.links.forEach((link) => this.removeLink(link))
        this.nodes.delete(node.id)
    }

    removeLink(linkOrLinkId: Link | string): void {
        const link = this.links.get(getSaveLinkOrNodeId(linkOrLinkId))
        if (!link) return
        link?.remove()
        this.links.delete(link.id)
    }

    setHighlightedElements({ NodeLinkOrId, traverse = HighlightTraverseType.SHOW_NEIGHBORS }: { NodeLinkOrId: Link | Node | string; traverse: HighlightTraverseType }) {
        const linkOrNodeId = getSaveLinkOrNodeId(NodeLinkOrId)
        const element = this.nodes.get(linkOrNodeId) ?? this.links.get(linkOrNodeId)
        if (element) {
            this.highlightController?.highlightElements({ element, traverse })
        }
    }

    resetHighlightLinks() {
        this.highlightController?.resetHighlightElements()
    }

    updateSharedValue<K extends keyof SharedGraphManagerData>(key: K, value: SharedGraphManagerData[K]): void {
        this.shared[key] = value
        if (key === "positionOffset" || key === "zoom") this.updateVisibleCanvasArea()
    }

    updateVisibleCanvasArea() {
        const zoom = this.shared.zoom
        const positionOffset = this.shared.positionOffset
        const canvasSize = this.shared.canvasSize
        const linkDistance = (this.shared.settings.forceParameters.linkDistance || 0) * 1.3

        const minX = -positionOffset.x / zoom - linkDistance
        const maxX = (canvasSize.x - positionOffset.x) / zoom + linkDistance
        const minY = -positionOffset.y / zoom - linkDistance
        const maxY = (canvasSize.y - positionOffset.y) / zoom + linkDistance

        this.shared.visibleCanvasArea = { minX, maxX, minY, maxY }
    }

    updateSettings(updatedSettings: AllPartial<Settings>) {
        if (updatedSettings.displayOptions) {
            this.shared.settings.displayOptions = {
                ...defaultDisplayOptions,
                ...this.shared.settings.displayOptions,
                ...updatedSettings.displayOptions,
            }
        }
        if (updatedSettings.textSettings) {
            this.shared.settings.textSettings = {
                ...defaultTextSettings,
                ...this.shared.settings.textSettings,
                ...updatedSettings.textSettings,
            }
        }
        if (updatedSettings.forceParameters) {
            this.shared.settings.forceParameters = {
                ...defaultForceParameters,
                ...this.shared.settings.forceParameters,
                ...updatedSettings.forceParameters,
            }
        }
        if (updatedSettings.actionCallbacks) {
            this.shared.settings.actionCallbacks = {
                ...defaultActionCallbacks,
                ...this.shared.settings.actionCallbacks,
                ...updatedSettings.actionCallbacks,
            }
        }
        return this.shared.settings
    }
}

function getSaveLinkOrNodeId(NodeLinkOrId: Node | Link | string) {
    return typeof NodeLinkOrId === "object" ? NodeLinkOrId.id : NodeLinkOrId
}
