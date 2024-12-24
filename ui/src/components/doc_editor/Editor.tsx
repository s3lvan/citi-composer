import React, { useEffect } from 'react'
import { Color } from '@tiptap/extension-color'
import ListItem from '@tiptap/extension-list-item'
import TextStyle from '@tiptap/extension-text-style'
import Code from '@tiptap/extension-code'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from '@/components/ui/button'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LinkIcon, MoreHorizontal } from 'lucide-react'
import './styles.scss'
import { CommentBubbleMenu } from './CommentBubbleMenu'
import { Editor as TTEditor } from "@tiptap/core"

const MenuBar = ({editor}: {editor: TTEditor}) => {
  return (
    <div className="flex items-center gap-2 p-2 border-b">
      <Select 
        defaultValue="paragraph"
        onValueChange={(value) => {
          console.log(editor.isActive("bold"))
          if (value === 'paragraph') {
            editor.chain().focus().setParagraph().run()
          } else if (value.startsWith('h')) {
            editor.chain().focus().toggleHeading({ level: parseInt(value[1]) }).run()
          }
        }}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Style" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paragraph">Body</SelectItem>
          <SelectItem value="h1">Heading 1</SelectItem>
          <SelectItem value="h2">Heading 2</SelectItem>
          <SelectItem value="h3">Heading 3</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1 px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-muted' : ''}
        >
          B
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-muted' : ''}
        >
          I
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'bg-muted' : ''}
        >
          U
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const previousUrl = editor.getAttributes('link').href
            const url = window.prompt('URL', previousUrl)
            
            if (url === null) {
              return
            }

            if (url === '') {
              editor.chain().focus().extendMarkRange('link').unsetLink().run()
              return
            }

            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
          }}
          className={editor.isActive('link') ? 'bg-muted' : ''}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={editor.isActive('highlight') ? 'bg-muted' : ''}
        >
          H
        </Button>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

const extensions = [
  Color.configure({ types: [TextStyle.name, ListItem.name] }),
  TextStyle.configure({ types: [ListItem.name] }),
  StarterKit.configure({
    bulletList: { keepMarks: true, keepAttributes: false },
    orderedList: { keepMarks: true, keepAttributes: false },
  }),
  Image,
  Code,
  Highlight,
  Link,
  Underline,
  Table.configure({
    resizable: true,
  }),
  TableRow,
  TableHeader,
  TableCell,
]

interface DocumentEditorProps {
  document: string;
  onDocumentChange?: (newDocument: string) => void;
  onComment: (comment: string, selectedText: string) => void;
}

const TiptapEditor = ({ document, onDocumentChange, onComment }: DocumentEditorProps) => {
  const editor = useEditor({
    extensions,
    content: document,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none'
      }
    },
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML()
      onDocumentChange?.(newContent)
    }
  })

  useEffect(() => {
    if (editor && document !== editor.getHTML()) {
      editor.commands.setContent(document, true)
    }
  }, [document, editor])

  if (!editor) {
    return null
  }

  return (
    <div>
      <MenuBar editor={editor}/>
      <div className="p-4">
        <EditorContent editor={editor} />
        <CommentBubbleMenu onSubmitComment={(comment) => {
          const { from, to } = editor.state.selection
          const selectedText = editor.state.doc.textBetween(from, to, ' ');
          onComment(comment, selectedText)
        }} editor={editor} />
      </div>
    </div>
  )
}

export default function Editor(props: DocumentEditorProps) {
  return (
    <div className="w-full">
      <TiptapEditor {...props} />
    </div>
  )
}