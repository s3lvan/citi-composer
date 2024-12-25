export interface ChatMessage {
  role: string
  content: string
  doc: string
  diff: string
  selectedText: string
}

export interface ChatSession {
  id: string
  title: string
}