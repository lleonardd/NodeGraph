import { useState } from 'react'
import { Settings } from '../../../src/Types/SettingsTypes'
import { graphManager } from '../GraphCanvas'
import { ActionButton } from './ActionButton'

export function GraphManagerSidebar({ settings, handleChange }: { settings: Settings, handleChange: (settingType: string, settingName: string, value: string | number | boolean) => void }) {
    const [graphStats, setGraphStats] = useState<{ nodes: number; links: number }>({ nodes: 0, links: 0 })

    const updateStatsAfter = (fn: (props?: any) => void, props?: any) => {
        fn(props)
        setGraphStats(prev => ({ ...prev, links: graphManager?.links.size ?? 0, nodes: graphManager?.nodes.size ?? 0 }))
    }

    const addNodes = (nr: number) => updateStatsAfter(() => {
        [...Array(nr)].forEach(() => graphManager?.addNode({ title: "Test node " + graphManager?.nodes.size }))
    })

    const getRandomMapValue = <T extends any>(map: Map<any, T>): T => {
        const keys = Array.from(map.keys())
        const randomKey = keys[Math.floor(Math.random() * keys.length)]
        return map.get(randomKey)!
    }

    const addRandomLinks = (nr: number) => updateStatsAfter(() => {
        Array.from({ length: nr }).forEach(() => graphManager?.addLink({
            startNodeOrId: getRandomMapValue(graphManager?.nodes),
            endNodeOrId: getRandomMapValue(graphManager?.nodes),
            title: "Test link " + graphManager?.links.size
        }))
    })

    const removeRandomNode = () => updateStatsAfter(() => {
        if (!graphManager?.nodes) return
        const randomNode = getRandomMapValue(graphManager?.nodes)
        graphManager?.removeNode(randomNode.id)
    })

    const removeRandomLink = () => updateStatsAfter(() => {
        if (!graphManager?.links) return
        const randomLink = getRandomMapValue(graphManager?.links)
        graphManager?.removeLink(randomLink.id)
    })

    const makeRandomLinkBidirectional = () => updateStatsAfter(() => {
        if (!graphManager?.links) return
        const randomExistingLink = getRandomMapValue(graphManager?.links)
        if (!randomExistingLink) return
        graphManager?.addLink({
            startNodeOrId: randomExistingLink.endNode,
            endNodeOrId: randomExistingLink.startNode,
            title: "Test link " + graphManager?.links.size
        })
    })


    return (
        <div className='[&>fieldset>label]:block [&>fieldset]:border-black [&>fieldset]:border [&>fieldset]:p-2 [&>fieldset]:mt-4 [&>fieldset]:ml-4 [&>fieldset]:mb-6 max-w-md h-full overflow-scroll'>
            <fieldset>
                <legend>Graph status</legend>
                <StatBatches items={[{ name: "Nodes", val: graphStats.nodes }, { name: "Links", val: graphStats.links }]} />
                <ActionButton Title='Pause Movement' onClick={() => graphManager?.pauseMovement()} />
                <ActionButton Title='Resume Movement' onClick={() => graphManager?.resumeMovement()} />
                <ActionButton Title='Add Node' onClick={() => addNodes(1)} />
                <ActionButton Title='Add 10 Nodes' onClick={() => addNodes(10)} />
                <ActionButton Title='Add 100 Nodes' onClick={() => addNodes(100)} />
                <ActionButton Title='Add random Link' onClick={() => addRandomLinks(1)} />
                <ActionButton Title='Add 10 random Links' onClick={() => addRandomLinks(10)} />
                <ActionButton Title='Add 100 random Links' onClick={() => addRandomLinks(100)} />
                <ActionButton Title='Make random Link bidirectional' onClick={makeRandomLinkBidirectional} />
                <ActionButton Title='Remove random Link' onClick={removeRandomLink} />
                <ActionButton Title='Remove random Node' onClick={removeRandomNode} />
            </fieldset>
            <fieldset>
                <legend>Force Parameters</legend>
                {Object.entries(settings.forceParameters).map(([name, value]) => (
                    <InputRange
                        key={name}
                        settingName={name}
                        {...rangeLookup[name as RangeLookupKey]}
                        value={value || ''}
                        onChange={(val) => handleChange('forceParameters', name, val)} />
                ))}
            </fieldset>

            <fieldset>
                <legend>Text Settings</legend>
                <label>
                    Font Size:
                    <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        className="accent-cyan-700"
                        value={settings.textSettings?.fontSize || ''}
                        onChange={(e) => handleChange('textSettings', 'fontSize', e.target.value)} />
                </label>
                <label>
                    Font Family:
                    <input
                        type="text"
                        value={settings.textSettings?.fontFamily || ''}
                        onChange={(e) => handleChange('textSettings', 'fontFamily', e.target.value)} />
                </label>
                <label>
                    Font Weight:
                    <select
                        value={settings.textSettings?.fontWeight || ''}
                        onChange={(e) => handleChange('textSettings', 'fontWeight', e.target.value)}
                    >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                        <option value="italic">Italic</option>
                        <option value="bolditalic">Bold Italic</option>
                    </select>
                </label>
                <label>
                    Font Color:
                    <input
                        type="color"
                        value={settings.textSettings?.fontColor || ''}
                        onChange={(e) => handleChange('textSettings', 'fontColor', e.target.value)} />
                </label>
            </fieldset>

            <fieldset>
                <legend>Display Options</legend>
                <label>
                    Show Arrows:
                    <input
                        type="checkbox"
                        checked={settings.displayOptions?.showArrows || false}
                        onChange={(e) => handleChange('displayOptions', 'showArrows', e.target.checked)} />
                </label>
                <label>
                    Default Node Color:
                    <input
                        type="color"
                        value={settings.displayOptions?.defaultNodeColor || ''}
                        onChange={(e) => handleChange('displayOptions', 'defaultNodeColor', e.target.value)} />
                </label>
                <label>
                    Default Link Color:
                    <input
                        type="color"
                        value={settings.displayOptions?.defaultLinkColor || ''}
                        onChange={(e) => handleChange('displayOptions', 'defaultLinkColor', e.target.value)} />
                </label>
                <label>
                    Default Node Highlight Color:
                    <input
                        type="color"
                        value={settings.displayOptions?.defaultNodeHighlightColor || ''}
                        onChange={(e) => handleChange('displayOptions', 'defaultNodeHighlightColor', e.target.value)} />
                </label>
                <label>
                    Default Link Highlight Color:
                    <input
                        type="color"
                        value={settings.displayOptions?.defaultLinkHighlightColor || ''}
                        onChange={(e) => handleChange('displayOptions', 'defaultLinkHighlightColor', e.target.value)} />
                </label>
                <InputRange
                    settingName='Default Node Size'
                    min="0"
                    max="200"
                    value={settings.displayOptions?.defaultNodeSize || ''}
                    step="1"
                    onChange={val => handleChange('displayOptions', 'defaultNodeSize', val)} />

                <InputRange
                    settingName='Default Link Thickness'
                    min="1"
                    max="10"
                    step="0.1"
                    value={settings.displayOptions?.defaultLinkThickness || ''}
                    onChange={val => handleChange('displayOptions', 'defaultLinkThickness', val)} />

                <InputRange
                    settingName='Text Visibility Zoom Threshold'
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={settings.displayOptions?.textVisibilityZoomThreshold || ''}
                    onChange={val => handleChange('displayOptions', 'textVisibilityZoomThreshold', val)} />
            </fieldset>
        </div>
    )
}



export const rangeLookup = {
    centerForce: { min: "0.0001", max: "1", step: "0.001", },
    repelForce: { min: "0", max: "10", step: "1", },
    linkForce: { min: "0.01", max: "1", step: "0.01", },
    linkDistance: { min: "1", max: "1000", step: "1", },
    maxMovementPerStep: { min: "1", max: "200", step: "1", },
}

interface InputRangeProps {
    settingName: string
    min: string
    max: string
    step: string
    unit?: string
    value: string | number
    onChange: (val: string) => void
}

export const InputRange = ({ settingName, min, max, step, unit = '', value, onChange }: InputRangeProps) => (
    <label>
        {settingName.charAt(0).toUpperCase() + settingName.slice(1)}:
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            className="accent-cyan-700"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
        ({value}{unit})
    </label>
)

export function StatBatches({ items }: { items: { name: string, val: number | string }[] }) {
    return (
        <div className="flex space-x-4 bg-gray-200 py-1 px-3 rounded-lg shadow mb-2">
            {items.map(item => (
                <div className="flex items-center space-x-2" key={item.name}>
                    <span className="font-semibold text-gray-700">{item.name}:</span>
                    <span className="bg-cyan-700 text-white px-3 py-1 rounded-full">{item.val}</span>
                </div>
            ))}
        </div>
    )
}



export type RangeLookupKey = 'centerForce' | 'repelForce' | 'linkForce' | 'linkDistance' | 'maxMovementPerStep'

