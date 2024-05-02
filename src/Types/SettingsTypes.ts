import { Link } from "../Link"
import { Node } from "../Node"

type ForceParameters = {
    centerForce: number
    repelForce: number
    linkForce: number
    linkDistance: number
    maxMovementPerStep: number
}

export const defaultForceParameters: ForceParameters = {
    centerForce: 0.05,
    repelForce: 5,
    linkForce: 0.05,
    linkDistance: 150,
    maxMovementPerStep: 100,
}

type TextSettings = {
    fontSize: number
    fontFamily: string
    fontWeight: "normal" | "bold" | "italic" | "bolditalic"
    fontColor: string
}

export const defaultTextSettings: TextSettings = {
    fontSize: 14,
    fontFamily: "Arial",
    fontWeight: "normal",
    fontColor: "#000000",
}

type DisplayOptions = {
    showArrows: boolean
    defaultNodeColor: string
    defaultLinkColor: string
    defaultNodeHighlightColor: string
    defaultLinkHighlightColor: string
    defaultNodeSize: number
    defaultLinkThickness: number
    showLinkTextOnHover: boolean
    textVisibilityZoomThreshold: number
}

export const defaultDisplayOptions: DisplayOptions = {
    showArrows: true,
    defaultNodeColor: "#4285F4",
    defaultLinkColor: "#34A853",
    defaultNodeHighlightColor: "#FBBC05",
    defaultLinkHighlightColor: "#EA4335",
    defaultNodeSize: 15,
    defaultLinkThickness: 2,
    showLinkTextOnHover: true,
    textVisibilityZoomThreshold: 0.7,
}

type ActionCallbacks = {
    nodesHovered: (node: Node[]) => void
    nodeClicked: (node: Node) => void
    nodeDoubleClicked: (node: Node) => void
    nodeDroppedOnNodes: (draggedNode: Node, droppedOnNodes: Node[]) => void
    linkHovered: (link: Link | null) => void
    linkClicked: (link: Link) => void
    linkDoubleClicked: (link: Link) => void
}

export const defaultActionCallbacks = {} as Partial<ActionCallbacks>

export type Settings = {
    displayOptions: DisplayOptions
    textSettings: TextSettings
    forceParameters: ForceParameters
    actionCallbacks: Partial<ActionCallbacks>
}

export const defaultSettings = {
    displayOptions: defaultDisplayOptions,
    textSettings: defaultTextSettings,
    forceParameters: defaultForceParameters,
    actionCallbacks: defaultActionCallbacks,
}
