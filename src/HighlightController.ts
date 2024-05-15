import { Link } from "./Link"
import { LinkGraphData } from "./LinkGraphData"
import { Node } from "./Node"

export enum HighlightTraverseType {
    SHOW_NEIGHBORS = "showNeighbors",
    FOLLOW_LINKS = "followLinks",
    FOLLOW_LINKS_BACKWARDS = "followLinksBackwards",
}

export type HighlightedElementsList = HighlightedElement[]
export type HighlightedElement = Link | Node

export class HighlightController extends LinkGraphData {
    constructor(props: LinkGraphData) {
        super(props)
    }

    resetHighlightElements() {
        this.linked.highlightedElements.forEach((element) => {
            element.actionStatus.highlighted = false
        })
        this.linked.highlightedElements = []
    }

    highlightElements({ element, traverse }: { element: Link | Node; traverse: HighlightTraverseType }) {
        if (element.actionStatus.highlighted) return
        this.highlightElement(element)

        if (traverse === HighlightTraverseType.FOLLOW_LINKS) {
            if (element instanceof Node) {
                element.links.forEach((link) => {
                    if (link.startNode === element) {
                        this.highlightElements({ element: link, traverse })
                    }
                    if (link.bidirectional) this.highlightElements({ element: link, traverse })
                })
            }
            if (element instanceof Link) {
                // this.highlightElement(element.startNode)
                this.highlightElements({ element: element.endNode, traverse })
                if (element.bidirectional) this.highlightElements({ element: element.startNode, traverse })
            }
        }

        if (traverse === HighlightTraverseType.FOLLOW_LINKS_BACKWARDS) {
            if (element instanceof Node) {
                element.links.forEach((link) => {
                    if (link.endNode === element) {
                        this.highlightElements({ element: link, traverse })
                    }
                    if (link.bidirectional) this.highlightElements({ element: link, traverse })
                })
            }
            if (element instanceof Link) {
                this.highlightElements({ element: element.startNode, traverse })
                if (element.bidirectional) this.highlightElements({ element: element.endNode, traverse })
            }
        }

        if (traverse === HighlightTraverseType.SHOW_NEIGHBORS) {
            if (element instanceof Node) {
                element.links.forEach((link) => {
                    this.highlightElement(link)
                    this.highlightElement(link.startNode)
                    this.highlightElement(link.endNode)
                })
            }
            if (element instanceof Link) {
                this.highlightElement(element.startNode)
                this.highlightElement(element.endNode)
            }
        }
    }

    highlightElement(element: HighlightedElement) {
        element.actionStatus.highlighted = true
        this.linked.highlightedElements.push(element)
    }
}

export function suppressForHighlights({ context, suppress }: { context: CanvasRenderingContext2D; suppress: boolean }) {
    if (suppress) {
        context.globalAlpha = 0.3
    }
}

export function setHighlight({ context, highlightStatus }: { context: CanvasRenderingContext2D; highlightStatus: boolean }) {
    if (highlightStatus) {
        context.save()
        context.globalAlpha = 1
    }
}

export function resetHighlight({ context, highlightStatus }: { context: CanvasRenderingContext2D; highlightStatus: boolean }) {
    if (highlightStatus) context.restore()
}
