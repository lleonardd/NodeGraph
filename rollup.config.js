import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'

export default {
    input: 'src/GraphManager.ts',
    output: {
        file: 'dist/GraphManager.js',
        format: 'iife',
        name: 'tempGraphManager', // Temporärer Name, um Konflikte zu vermeiden
        footer: 'window.GraphManager = tempGraphManager.GraphManager;'
    },
    plugins: [
        nodeResolve(),
        typescript()
    ]
}
