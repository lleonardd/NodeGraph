import { Link, LinkProps } from './Link'
import { Coordinate } from './Types/Coordinate'
import { Settings, defaultActionCallbacks, defaultDisplayOptions, defaultForceParameters, defaultSettings, defaultTextSettings } from './Types/SettingsTypes'
import { PhysicalMovingObjectProps } from './PhysicalMovableObject'
import { NodeProps, Node } from './Node'
import { InteractionController } from './InteractionController'
import { AllPartial } from './Types/utilTypes'

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
}

export class GraphManager {
	nodes: Node[]
	links: Link[]
	shared: SharedGraphManagerData
	canvas: HTMLCanvasElement
	context: CanvasRenderingContext2D | null
	animationFrameId: number | null
	interactionController: InteractionController | null

	constructor({ settings, canvas }: GraphManagerProps) {
		this.canvas = canvas
		this.context = canvas.getContext('2d')
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
			update: this.updateSharedValue.bind(this),
			updateCanvasSize: this.updateCanvasSize.bind(this),
		}
		this.updateSettings(settings)
		this.animationFrameId = null
		this.interactionController = new InteractionController({ graphManager: this, linked: this.shared })
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

	update() {
		this.nodes.forEach(node => node.move(this.nodes))
		this.interactionController?.handleHover()
	}

	draw() {
		this.context!.clearRect(0, 0, this.canvas.width, this.canvas.height)
		this.context!.save()
		this.context!.translate(this.shared.positionOffset.x, this.shared.positionOffset.y)
		this.context!.scale(this.shared.zoom, this.shared.zoom)
		this.nodes.forEach(node => node.draw({ context: this.context! }))
		this.links.forEach(link => link.draw({ context: this.context! }))
		this.context!.restore()
	}

	addNode(props: Partial<NodeProps & PhysicalMovingObjectProps>) {
		const position = { x: (this.canvas.width + this.shared.positionOffset.x) * (0.5 - Math.random()), y: (this.canvas.height + this.shared.positionOffset.y) * (0.5 - Math.random()) }
		const newNode = new Node({ ...props, position, linked: this.shared })
		this.nodes.push(newNode)
		return newNode
	}

	addLink(props: Partial<LinkProps> & { startNode: Node, endNode: Node }) {
		if (props.startNode === props.endNode) return null
		const newLink = new Link({ ...props, linked: this.shared })
		const existsAtIndex = this.links.findIndex(link => link.id === newLink.id)
		if (existsAtIndex === -1) {
			this.links.push(newLink)
			return newLink
		} else if (props?.bidirectional || this.links[existsAtIndex].startNode === props.endNode) {
			this.links[existsAtIndex].bidirectional = props?.bidirectional ?? true
		}
		return null
	}

	updateNode(nodeOrNodeId: Node | string, props: Partial<NodeProps & PhysicalMovingObjectProps>) {
		const nodeId = getSaveLinkOrNodeId(nodeOrNodeId)
		const nodeIndex = this.nodes.findIndex(node => node.id === nodeId)
		if (nodeIndex === -1) return null
		this.nodes[nodeIndex].update(props)
		return this.nodes[nodeIndex]
	}

	updateLink(linkOrLinkId: Link | string, props: Partial<LinkProps>) {
		const linkId = getSaveLinkOrNodeId(linkOrLinkId)
		const linkIndex = this.links.findIndex(link => link.id === linkId)
		if (linkIndex === -1) return null
		this.links[linkIndex].update(props)
		return this.links[linkIndex]
	}

	removeNode(nodeOrNodeId: Node | string): void {
		const nodeId = getSaveLinkOrNodeId(nodeOrNodeId)
		const associatedLinks = this.links.filter(link => link.startNode.id === nodeId || link.endNode.id === nodeId)
		associatedLinks.forEach(link => this.removeLink(link.id))
		const nodeIndex = this.nodes.findIndex(node => node.id === nodeId)
		if (nodeIndex !== -1) {
			this.nodes.splice(nodeIndex, 1)
		}
	}

	removeLink(linkOrLinkId: Link | string): void {
		const linkId = getSaveLinkOrNodeId(linkOrLinkId)
		const linkIndex = this.links.findIndex(link => link.id === linkId)
		if (linkIndex !== -1) {
			this.links.splice(linkIndex, 1)
		}
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
				...updatedSettings.displayOptions
			}
		}
		if (updatedSettings.textSettings) {
			this.shared.settings.textSettings = {
				...defaultTextSettings,
				...this.shared.settings.textSettings,
				...updatedSettings.textSettings
			}
		}
		if (updatedSettings.forceParameters) {
			this.shared.settings.forceParameters = {
				...defaultForceParameters,
				...this.shared.settings.forceParameters,
				...updatedSettings.forceParameters
			}
		}
		if (updatedSettings.actionCallbacks) {
			this.shared.settings.actionCallbacks = {
				...defaultActionCallbacks,
				...this.shared.settings.actionCallbacks,
				...updatedSettings.actionCallbacks
			}
		}
		return this.shared.settings
	}
}

function getSaveLinkOrNodeId(NodeLinkOrId: Node | Link | string) {
	return typeof NodeLinkOrId === 'object' ? NodeLinkOrId.id : NodeLinkOrId
}