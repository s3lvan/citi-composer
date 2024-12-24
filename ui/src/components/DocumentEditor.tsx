'use client'

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '@/editor.css'
import EditorToolbar, {modules, formats} from './EditorToolbar';
import Editor from './doc_editor/Editor';

interface DocumentEditorProps {
  document: string;
  onDocumentChange: (newDocument: string) => void;
  onSelectionChange: (selectedText: string) => void;
  onComment: (comment: string, selectedText: string) => void;
}

export default function DocumentEditor({ document, onDocumentChange, onSelectionChange, onComment }: DocumentEditorProps) {
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onDocumentChange(value)
    }
  }

  const handleSelectionChange = (range, source, editor) => {
    if (!range || !editor) {
      return;
    }
    const selectedText = editor.getText().substring(range.index - 1, range.index + range.length)
    onSelectionChange(selectedText)
  }

  return (
    <div className="flex-grow p-8 overflow-auto">
        {/* <EditorToolbar /> */}
        {/* <ReactQuill
            theme="snow"
            value={document}
            onChange={handleEditorChange}
            onChangeSelection={handleSelectionChange}
            style={{ height: "calc(100vh - 200px)" }}
            modules={modules}
            formats={formats}
          /> */}
        <Editor document={document} onDocumentChange={handleEditorChange} onComment={onComment} />
    </div>
  )
}

