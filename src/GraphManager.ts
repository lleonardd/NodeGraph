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
}

export class GraphManager {
    nodes: Node[]
    links: Link[]
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
        this.updateCanvasSize()
        this.nodes = []
        this.links = []
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
        if (props?.id && this.nodes.findIndex((node) => node.id === props?.id) !== -1) return null
        const newNode = new Node({ ...props, position, linked: this.shared })
        this.nodes.push(newNode)
        return newNode
    }

    addLink(props: Partial<LinkProps> & { startNodeOrId: LinkProps["startNode"]; endNodeOrId: LinkProps["endNode"] }) {
        const startNode = typeof props.startNodeOrId === "object" ? props.startNodeOrId : this.nodes.find((node) => node.id === props.startNodeOrId)
        const endNode = typeof props.endNodeOrId === "object" ? props.endNodeOrId : this.nodes.find((node) => node.id === props.endNodeOrId)

        if (!startNode || !endNode || startNode === endNode) return null
        const futureLinkId = Link.buildLinkId(startNode.id, endNode.id)
        const existsAtIndex = this.links.findIndex((link) => link.id === futureLinkId)
        if (existsAtIndex !== -1) {
            this.updateLink(this.links[existsAtIndex], props)
            return null
        }

        const newLink = new Link({ ...props, startNode, endNode, linked: this.shared, bidirectional: props?.bidirectional })
        this.links.push(newLink)
        return newLink
    }

    updateNode(nodeOrNodeId: Node | string, props: Partial<NodeProps & PhysicalMovingObjectProps>) {
        const nodeId = getSaveLinkOrNodeId(nodeOrNodeId)
        const nodeIndex = this.nodes.findIndex((node) => node.id === nodeId)
        if (nodeIndex === -1) return null
        this.nodes[nodeIndex].update(props)
        return this.nodes[nodeIndex]
    }

    updateLink(linkOrLinkId: Link | string, props: Partial<LinkProps>) {
        const linkId = getSaveLinkOrNodeId(linkOrLinkId)
        const linkIndex = this.links.findIndex((link) => link.id === linkId)
        if (linkIndex === -1) return null
        this.links[linkIndex].update(props)
        return this.links[linkIndex]
    }

    removeNode(nodeOrNodeId: Node | string): void {
        const node = typeof nodeOrNodeId === "object" ? nodeOrNodeId : this.nodes.find((node) => node.id === nodeOrNodeId)
        if (!node) return
        node.links.forEach((link) => this.removeLink(link))
        const nodeIndex = this.nodes.findIndex((n) => n === node)
        if (nodeIndex !== -1) {
            this.nodes.splice(nodeIndex, 1)
        }
    }

    removeLink(linkOrLinkId: Link | string): void {
        const link = typeof linkOrLinkId === "object" ? linkOrLinkId : this.links.find((link) => link.id === linkOrLinkId)
        if (!link) return
        link?.remove()
        const linkIndex = this.links.findIndex((l) => l === link)
        if (linkIndex !== -1) {
            this.links.splice(linkIndex, 1)
        }
    }

    setHighlightedElements({ NodeLinkOrId, traverse = HighlightTraverseType.SHOW_NEIGHBORS }: { NodeLinkOrId: Link | Node | string; traverse: HighlightTraverseType }) {
        const linkOrNodeId = getSaveLinkOrNodeId(NodeLinkOrId)
        const element = this.nodes.find((n) => n.id === linkOrNodeId) ?? this.links.find((l) => l.id === linkOrNodeId)
        if (element) {
            this.highlightController?.highlightElements({ element, traverse })
        }
    }

    resetHighlightLinks() {
        this.highlightController?.resetHighlightElements()
    }

    updateSharedValue<K extends keyof SharedGraphManagerData>(key: K, value: SharedGraphManagerData[K]): void {
        this.shared[key] = value
    }

    addToPositionOffset(amountToAdd: Coordinate) {
        this.shared.positionOffset.x = amountToAdd.x
        this.shared.positionOffset.y = amountToAdd.y
    }

    setZoom(val: number) {
        this.shared.zoom = val
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
