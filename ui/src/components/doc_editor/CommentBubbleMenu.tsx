'use client'

import { BubbleMenu, BubbleMenuProps } from '@tiptap/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Expand, MessageSquare, RefreshCw, Send } from 'lucide-react'

interface CommentBubbleMenuProps extends Omit<BubbleMenuProps, 'children'> {
  onSubmitComment: (comment: string) => void
  onRephrase: () => void
  onExpand: () => void
}

export function CommentBubbleMenu({
  onSubmitComment,
  onRephrase,
  onExpand,
  ...props
}: CommentBubbleMenuProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [comment, setComment] = useState('')

  const handleSubmit = () => {
    if (comment.trim()) {
      onSubmitComment(comment)
      setComment('')
      setIsChatOpen(false)
    }
  }

  return (
    <BubbleMenu
      {...props}
      className="flex flex-col items-start gap-2 p-2 bg-white border rounded-lg shadow-lg"
    >
      {/* Button Group */}
      <div className="flex items-center gap-2">
        {/* Chat Button */}
        <Button
          variant={isChatOpen ? 'primary' : 'ghost'}
          size="sm"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => setIsChatOpen((prev) => !prev)}
          aria-label="Chat"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm">Chat</span>
        </Button>

        {/* Rephrase Button */}
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          onClick={onRephrase}
          aria-label="Rephrase"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">Rephrase</span>
        </Button>

        {/* Expand Button */}
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          onClick={onExpand}
          aria-label="Expand"
        >
          <Expand className="w-4 h-4" />
          <span className="text-sm">Expand</span>
        </Button>
      </div>

      {/* Chat Input Area */}
      {isChatOpen && (
        <div className="flex flex-col gap-2 w-full mt-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ask AI about this selection..."
            className="min-h-[80px] w-full resize-none"
            autoFocus
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            className="self-end flex items-center gap-1"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </Button>
        </div>
      )}
    </BubbleMenu>
  )
}
