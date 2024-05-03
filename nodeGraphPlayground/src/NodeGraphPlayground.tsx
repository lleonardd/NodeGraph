import { useState } from 'react'
import { GraphManagerSidebar } from './Components/GraphManagerSidebar'
import GraphCanvas, { graphManager } from './GraphCanvas'
import { Settings, defaultSettings } from '../../src/Types/SettingsTypes'
import HighlightedCodeEditor from './Components/HighlightedCodeEditor'
import JSONDisplay from './Components/JSONDisplay'
import { Grid } from './Components/Grid'
import { Node } from "../../src/Node"
import { Link } from "../../src/Link"
import { HighlightTraverseType } from '../../src/HighlightFunctionality'

const defaultSettingsWithDemoActions = {
    ...defaultSettings,
    actionCallbacks: {
        nodesHovered: (nodes: Node[]) => {
            if (nodes.length === 0) graphManager?.resetHighlightLinks()
            else nodes.forEach(node => graphManager?.setHighlightedElements({ NodeLinkOrId: node, traverse: HighlightTraverseType.FOLLOW_LINKS }))
            console.log('Nodes hovered: ', nodes.map(node => node.id).join(", "))
        },
        nodeClicked: (node: Node) => { console.log('Node clicked: ', node.id) },
        nodeDoubleClicked: (node: Node) => { console.log('Node double clicked: ', node.id) },
        nodeDroppedOnNodes: (node: Node, nodes: Node[]) => {
            console.log('Node: ', node.id, ' dropped on Nodes: ', nodes.map(node => node.id).join(", "))
            nodes.forEach(droppedOn => graphManager?.addLink({ startNodeOrId: node, endNodeOrId: droppedOn }))
        },
        linkHovered: (link: Link | null) => {
            if (!link) graphManager?.resetHighlightLinks()
            else graphManager?.setHighlightedElements({ NodeLinkOrId: link, traverse: HighlightTraverseType.FOLLOW_LINKS_BACKWARDS })
            console.log('Link hovered: ', link?.id)
        },
        linkClicked: (link: Link) => { console.log('Link clicked: ', link.id) },
        linkDoubleClicked: (link: Link) => { console.log('Link double clicked: ', link.id) }
    },
} as unknown as Settings

export default function NodeGraphPlayground() {
    const [settings, setSettings] = useState<Settings>(defaultSettingsWithDemoActions)

    const handleChange = (settingType: string, settingName: string, value: string | number | boolean | Function) => {
        const newSettings = { actionCallbacks: settings.actionCallbacks, displayOptions: settings.displayOptions, forceParameters: settings.forceParameters, textSettings: settings.textSettings } as Settings // updates canvas because of shallow copy of object

        const parsedValue = typeof value === 'string' && !isNaN(parseFloat(value))
            ? parseFloat(value)
            : value;

        (newSettings[settingType as keyof typeof settings] as any)[settingName] = parsedValue
        graphManager?.updateSettings(newSettings)
        setSettings(newSettings)
    }

    return (
        <>
            <div className='flex w-screen h-[90vh] overflow-hidden'>
                <div className='min-w-max h-full'>
                    {<GraphManagerSidebar settings={settings} handleChange={handleChange} />}
                </div>
                <div className='flex-grow relative border border-black m-4'>
                    <GraphCanvas settings={defaultSettingsWithDemoActions} />
                </div>
            </div>
            <div className='m-4'>
                <Grid cols={2}>
                    <HighlightedCodeEditor
                        title="nodesHovered"
                        defaultValue={settings.actionCallbacks.nodesHovered?.toString()} />
                    <HighlightedCodeEditor
                        title="nodeClicked"
                        defaultValue={settings.actionCallbacks.nodeClicked?.toString()} />
                    <HighlightedCodeEditor
                        title="nodeDoubleClicked"
                        defaultValue={settings.actionCallbacks.nodeDoubleClicked?.toString()} />
                    <HighlightedCodeEditor
                        title="nodeDroppedOnNodes"
                        defaultValue={settings.actionCallbacks.nodeDroppedOnNodes?.toString()} />
                    <HighlightedCodeEditor
                        title="linkHovered"
                        defaultValue={settings.actionCallbacks.linkHovered?.toString()} />
                    <HighlightedCodeEditor
                        title="linkClicked"
                        defaultValue={settings.actionCallbacks.linkClicked?.toString()} />
                    <HighlightedCodeEditor
                        title="linkDoubleClicked"
                        defaultValue={settings.actionCallbacks.linkDoubleClicked?.toString()} />
                </Grid>
                <JSONDisplay title='Current settings' data={settings} />
            </div>
        </>
    )
}
