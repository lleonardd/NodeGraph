import { useRef, useEffect } from 'react'
import { GraphManager } from "../../src/GraphManager"
import { Settings } from '../../src/Types/SettingsTypes'

export let graphManager: null | GraphManager = null

export default function GraphCanvas({ settings }: { settings?: Settings }) {
    const canvasRef = useRef(null)

    useEffect(() => {
        if (canvasRef.current && !graphManager) {
            graphManager = new GraphManager({ settings: settings ?? {}, canvas: canvasRef.current })
            graphManager.startAnimation()
        }
    }, [canvasRef])

    return (
        <canvas ref={canvasRef} className='absolute top-0 left-0 w-full h-full'></canvas>
    )
}
