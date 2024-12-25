import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
// Replace with your own Textarea import or just use <textarea>.
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, History } from 'lucide-react'
import { ChatMessage } from '@/models'
import { ChatSession } from '@/session'
import Markdown from './ui/markdown'
import "./chat.css"

// Mock data for chat history
// const mockChatHistory = [
//   { id: 1, title: "Document 1 - Introduction", date: "2023-06-01" },
//   { id: 2, title: "Document 2 - Chapter 1 Draft", date: "2023-06-02" },
//   { id: 3, title: "Document 3 - Conclusion", date: "2023-06-03" },
//   { id: 4, title: "Document 4 - Research Notes", date: "2023-06-04" },
//   { id: 5, title: "Document 5 - Project Outline", date: "2023-06-05" },
// ]

type SideBarProps = {
  onSendMessage: (message: string) => void
  chatMessages: ChatMessage[]
}

export default function ChatSidebar({ onSendMessage, chatMessages }: SideBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);

  useEffect(() => {
    fetch('/api/chat-sessions')
      .then(res => res.json() as Promise<ChatSession[]>)
      .then(setChatHistory)
      .catch(err => console.error(err))
  }, [])

  const filteredHistory = (chatHistory || []).filter(chat => 
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sendMessage = () => {
    if (message.trim() !== '') {
      onSendMessage(message);
      setMessage('')
    }
  }

  return (
    <div className="w-80 bg-background border-r border-border flex flex-col">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="text-lg font-semibold">Composer Chat</h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
              <History className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <h3 className="text-md font-semibold mb-2">Chat History</h3>
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full border rounded px-2 py-1"
              />
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <ScrollArea className="h-48">
              {filteredHistory.map((chat) => (
                <div key={chat.id} className="mb-2 p-2 text-sm hover:bg-accent rounded cursor-pointer">
                  <div className="font-medium">{chat.title}</div>
                  <div className="text-xs text-muted-foreground">{chat.date}</div>
                </div>
              ))}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
      <ScrollArea className="flex-grow p-4">
        {chatMessages.map((msg, index) => (
          <div key={index} className={`mb-4 ${msg.role === 'human' ? 'text-right' : 'text-left'}`}>
            <div
              className={`inline-block p-2 rounded-lg chat-bubbles ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <Markdown contents={msg.content} />
            </div>
          </div>
        ))}
      </ScrollArea>
      <div className="p-4 border-t border-border">
        <Textarea
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            // Submit on Command/Ctrl + Enter
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              sendMessage()
            }
          }}
          className="resize-none"
        />

        <Button onClick={sendMessage} className="mt-2 w-full">
          Send
        </Button>
        <div className="text-xs text-muted-foreground mt-1">
          Press <span className="font-mono">⌘</span>+Enter or <span className="font-mono">Ctrl</span>+Enter to send
        </div>
      </div>
    </div>
  )
}
