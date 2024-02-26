import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-json'
import 'prismjs/themes/prism.css'

export default function JSONDisplay({ data, className, title }: { data: Object, className?: string, title: string }) {
    const jsonReplacer = function (_: any, val: any) {
        if (typeof val === 'function') {
            return "fn: " + val.toString() + " (turned into string to be displayed in json)"
        }

        return val
    }
    const formattedData = JSON.stringify(data, jsonReplacer, 2)

    return (
        <fieldset className={'relative border border-black ' + className}>
            <legend className='ml-4'>{title}</legend>
            <Editor
                value={formattedData}
                highlight={(code) => highlight(code, languages.json, 'json')}
                onValueChange={() => { }}
                style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 12,
                    outline: 0,
                }}
            />
        </fieldset>
    )
}