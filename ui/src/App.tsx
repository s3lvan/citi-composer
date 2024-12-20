import { useState } from 'react';
import ChatSidebar from './components/ChatSidebar';
import DocumentEditor from './components/DocumentEditor';
import CodeEditor from './components/CodeEditor'; // Assume you have a CodeEditor component
import { Button } from "@/components/ui/button";
import { MessageSquare } from 'lucide-react';
import { ChatMessage, ChatSession } from './models';

interface ChatStreamMessage {
  message: string;
  artifact: string;
}

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [artifact, setArtifact] = useState('');
  const [chatSession, setChatSession] = useState<ChatSession | null>();
  const [selectedText, setSelectedText] = useState('');
  const [isDocumentEditor, setIsDocumentEditor] = useState(true); // Track editor type

  const createChatSession = async (): Promise<ChatSession | null> => {
    const response = await fetch('/api/chat-sessions', {
        method: 'POST',
    });

    if (response.ok) {
        const data = await response.json();
        setChatSession(data);

        return data;
    } else {
        console.error('Failed to create chat session');
    }

    return null;
  };

  const handleSendMessage = async (message: string) => {
    if (message.trim()) {
      const newMessage = { role: 'human', content: message };
      setChatMessages([...chatMessages, newMessage]);

      let sessionId = '';
      if (!chatSession) {
        sessionId = (await createChatSession())?.id || '';
      } else {
        sessionId = chatSession.id;
      }

      const response = await fetch(`/api/chat-sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          content: message,
          artifact: artifact,
          selectedText,
          isDocumentEditor 
        })
      });

      const reader = response.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          const chunks = decoder.decode(value);
          if (!chunks) {
            continue;
          }

          const chunksArr = chunks.split('\r\n');
          let previousChunk = '';
          chunksArr.forEach((chunk) => {
            if (!chunk.trim()) {
              return;
            }

            let msg: ChatStreamMessage;
            try {
              msg = JSON.parse(previousChunk + chunk);
              previousChunk = '';
            } catch(e) {
              previousChunk += chunk;
              console.error("Could not parse chunk", chunk);
              return;
            }
            
            if (msg.artifact) {
              setArtifact(msg.artifact);
            }

            if (msg.message) {
              setChatMessages([...chatMessages, newMessage, { role: 'assistant', content: msg.message }]);
            }
          });
        }
      }
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {isSidebarOpen && <ChatSidebar onSendMessage={handleSendMessage} chatMessages={chatMessages} />}
      <div className="flex-1 flex flex-col">
        <header className="flex justify-between items-center p-4 border-b">
          <Button variant="ghost" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <MessageSquare className="h-[1.2rem] w-[1.2rem]" />
          </Button>
          <h1 className="text-2xl font-bold">Composer</h1>
          <Button variant="outline" onClick={() => setIsDocumentEditor(!isDocumentEditor)}>
            {isDocumentEditor ? 'Switch to Code Editor' : 'Switch to Document Editor'}
          </Button>
        </header>
        {isDocumentEditor ? (
          <DocumentEditor 
            document={artifact} 
            onDocumentChange={(doc) => setArtifact(doc)} 
            onSelectionChange={setSelectedText} 
          />
        ) : (
          <CodeEditor
            code={artifact}
            onCodeChange={(code) => setArtifact(code)}
          />
        )}
      </div>
    </div>
  );
}
