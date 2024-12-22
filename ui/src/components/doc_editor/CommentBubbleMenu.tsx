'use client'

import { BubbleMenu, BubbleMenuProps } from '@tiptap/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Send } from 'lucide-react'

interface CommentBubbleMenuProps extends Omit<BubbleMenuProps, 'children'> {
  onSubmitComment: (comment: string) => void
}

export function CommentBubbleMenu({ onSubmitComment, ...props }: CommentBubbleMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [comment, setComment] = useState('')

  const handleSubmit = () => {
    if (comment.trim()) {
      onSubmitComment(comment)
      setComment('')
      setIsOpen(false)
    }
  }

  return (
    <BubbleMenu
      {...props}
      className="flex items-center gap-2 p-1 bg-white border rounded-lg shadow-lg"
    >
      {!isOpen ? (
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
      ) : (
        <div className="flex flex-col gap-2 p-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ask AI about this selection..."
            className="min-h-[80px] w-[300px] resize-none"
            autoFocus
          />
          <Button size="sm" onClick={handleSubmit} className="self-end">
            <Send className="w-4 h-4 mr-2" />
            Send
          </Button>
        </div>
      )}
    </BubbleMenu>
  )
}