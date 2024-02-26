import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/themes/prism.css'

export default function HighlightedCodeEditor({ defaultValue, className, title }: { defaultValue?: string, className?: string, title: string }) {
    return (
        <fieldset className={'border border-black block' + className}>
            <legend className='ml-4'>{title}</legend>
            <Editor
                value={defaultValue ?? ""}
                onValueChange={() => { }}
                highlight={(code) => highlight(code, languages.js, 'javascript')}
                style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 12,
                    outline: 0,
                }}
            />
        </fieldset>
    )
}
