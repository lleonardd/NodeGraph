# Node Graph Library

Node Graph Library provides interactive node-graphs with various utility functions, interaction callbacks and settings for customization. Try it now in the [playground](https://lleonardd.github.io/NodeGraph/).

![Build and Deploy to GitHub Pages](https://github.com/lleonardd/NodeGraph/actions/workflows/ghPages.yml/badge.svg)

## `GraphManager` Class Functions

-   `startAnimation()`: Starts the animation loop.
-   `stopAnimation()`: Stops the animation loop.
-   `pauseMovement()`: Pauses the movement of nodes.
-   `resumeMovement()`: Resumes the movement of nodes.
-   `addNode(props)`: Adds a new node with specified properties.
-   `addLink(props)`: Adds a link between two nodes.
-   `updateNode(nodeOrNodeId, props)`: Updates node properties.
-   `updateLink(linkOrLinkId, props)`: Updates link properties.
-   `removeNode(nodeOrNodeId)`: Removes a node.
-   `removeLink(linkOrLinkId)`: Removes a link.
-   `setHighlightedElements({ NodeLinkOrId: Link | Node | string; traverse: HighlightTraverseType })`: Highlights a node or link and traverses the graph.
-   `resetHighlightLinks()`: Resets all highlighted links.

## Settings

These settings object is split into multiple sub objects.

You can also use the [playground](https://lleonardd.github.io/NodeGraph/) to play around with different settings and copy the finished settings object from the bottom of the page.

| Setting           | Description                                                      |
| ----------------- | ---------------------------------------------------------------- |
| `displayOptions`  | Configures display properties like arrows, colors, and sizes.    |
| `textSettings`    | Defines text appearance (font size, family, color, weight).      |
| `forceParameters` | Adjusts forces applied in the graph layout (center, repel, etc). |
| `actionCallbacks` | Callbacks for interaction events (click, hover, etc).            |

### Display Options

| Option                        | Description                      |
| ----------------------------- | -------------------------------- |
| `showArrows`                  | Toggles arrow display on links.  |
| `defaultNodeColor`            | Sets default node color.         |
| `defaultLinkColor`            | Sets default link color.         |
| `defaultNodeHighlightColor`   | Color for highlighted nodes.     |
| `defaultLinkHighlightColor`   | Color for highlighted links.     |
| `defaultNodeSize`             | Sets default node size.          |
| `defaultLinkThickness`        | Sets default link thickness.     |
| `textVisibilityZoomThreshold` | Minimum zoom level to show text. |
| `showLinkTextOnHover`         | Toggles link text on hover.      |
| `showLinkTextOnHighlight`     | Toggles link text on highlight.  |

### Text Settings

| Option       | Description                  |
| ------------ | ---------------------------- |
| `fontSize`   | Sets font size for labels.   |
| `fontFamily` | Sets font family for labels. |
| `fontWeight` | Sets font weight for labels. |
| `fontColor`  | Sets font color for labels.  |

### Force Parameters

| Parameter            | Description                              |
| -------------------- | ---------------------------------------- |
| `centerForce`        | Attraction to the center of the graph.   |
| `repelForce`         | Force between nodes to repel each other. |
| `linkForce`          | Attraction force of links.               |
| `linkDistance`       | Ideal distance between linked nodes.     |
| `maxMovementPerStep` | Maximum movement allowed per frame.      |

## Action Callbacks

Below is a table detailing the types for the functions passed to action callbacks within the graph manager settings.

| Callback             | Function Type                                         |
| -------------------- | ----------------------------------------------------- | -------------- |
| `nodesHovered`       | `(nodes: Node[]) => void`                             |
| `nodeClicked`        | `(node: Node) => void`                                |
| `nodeDoubleClicked`  | `(node: Node) => void`                                |
| `nodeDroppedOnNodes` | `(draggedNode: Node, droppedOnNodes: Node[]) => void` |
| `linkHovered`        | `(link: Link                                          | null) => void` |
| `linkClicked`        | `(link: Link) => void`                                |
| `linkDoubleClicked`  | `(link: Link) => void`                                |

Each callback provides specific canvas interaction callbacks.
