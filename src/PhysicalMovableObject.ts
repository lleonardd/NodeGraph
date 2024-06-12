import { LinkGraphData } from "./LinkGraphData"
import { Link } from "./Link"
import { Coordinate } from "./Types/Coordinate"

export type PhysicalMovingObjectProps = {
	position: Coordinate
}

export class PhysicalMovingObject extends LinkGraphData {
	position: Coordinate

	constructor(props: Partial<PhysicalMovingObjectProps> & LinkGraphData) {
		super(props)
		this.position = { x: 0, y: 0, ...props.position }
	}

	move(allPhysicalObjects: Map<string, PhysicalMovingObject>, links: Link[], repelAttractSwitchDistance: number) {
		if (this === (this.linked.draggedNode as PhysicalMovingObject)) return
		const forces = this.linked.settings.forceParameters
		let dx = 0 - this.position.x * forces.centerForce
		let dy = 0 - this.position.y * forces.centerForce

		const scaledRepelForce = parseFloat((forces.repelForce / Math.sqrt(allPhysicalObjects.size + 1)).toFixed(2))

		// Repel
		allPhysicalObjects.forEach((otherPhysicalObject) => {
			if (otherPhysicalObject === this) return
			const distance = this.approximateDistance(otherPhysicalObject.position)
			const attract = otherPhysicalObject === (this.linked.draggedNode as PhysicalMovingObject) && distance < repelAttractSwitchDistance
			const direction = attract ? -1 : 1
			dx += ((direction * (this.position.x - otherPhysicalObject.position.x)) / distance) * scaledRepelForce
			dy += ((direction * (this.position.y - otherPhysicalObject.position.y)) / distance) * scaledRepelForce
		})

		// Attract to linked
		links.forEach((link) => {
			const otherPhysicalObject = (link.startNode as PhysicalMovingObject) === this ? (link.endNode as PhysicalMovingObject) : (link.startNode as PhysicalMovingObject)
			const distance = this.approximateDistance(otherPhysicalObject.position)
			const linkDx = (otherPhysicalObject.position.x - this.position.x) * forces.linkForce
			const linkDy = (otherPhysicalObject.position.y - this.position.y) * forces.linkForce

			const distanceCorrection = (distance - forces.linkDistance) / distance
			dx += linkDx * distanceCorrection
			dy += linkDy * distanceCorrection
		})

		const totalMovement = Math.sqrt(dx * dx + dy * dy)
		if (totalMovement < 0.05) return

		// Limit max speed
		dx = Math.min(forces.maxMovementPerStep, Math.max(-forces.maxMovementPerStep, dx))
		dy = Math.min(forces.maxMovementPerStep, Math.max(-forces.maxMovementPerStep, dy))

		this.position.x += dx
		this.position.y += dy
	}

	private calculateExactDistance(otherPosition: Coordinate): number {
		const dx = this.position.x - otherPosition.x
		const dy = this.position.y - otherPosition.y
		return Math.hypot(dx, dy)
	}

	private approximateDistance(otherPosition: Coordinate) {
		const dx = Math.abs(this.position.x - otherPosition.x)
		const dy = Math.abs(this.position.y - otherPosition.y)
		return dx + dy
	}
}
