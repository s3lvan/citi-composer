import { useEffect, useState } from 'react';
import ChatSidebar from './components/ChatSidebar';
import DocumentEditor from './components/DocumentEditor';
import CodeEditor from './components/CodeEditor'; // Assume you have a CodeEditor component
import { Button } from "@/components/ui/button";
import { MessageSquare } from 'lucide-react';
import { ChatMessage, ChatSession } from './models';
import "./App.css"

interface ChatStreamMessage {
  message: string;
  artifact: string;
}

interface ArtifactVersion {
  version: string;
  createdBy: string;
  content: string;
}

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [artifact, setArtifact] = useState('');
  const [chatSession, setChatSession] = useState<ChatSession | null>();
  const [selectedText, setSelectedText] = useState('');
  const [isDocumentEditor, setIsDocumentEditor] = useState(true); // Track editor type
  const [artifactVersions, setArtifactVersions] = useState<ArtifactVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState('latest');

  useEffect(() => {
    setIsDocumentEditor(localStorage.getItem("isDocumentEditor") === "true");
  }, [])

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

  const handleSendMessage = async (message: string, selection: string = '') => {
    if (message.trim()) {
      const newMessage = { role: 'human', content: message };
      setChatMessages([...chatMessages, newMessage]);
      const newVersionHuman = {
        version: artifactVersions.length === 0 ? '1' : (artifactVersions.length + 1).toString(),
        createdBy: 'human',
        content: artifact,
      };
      setArtifactVersions([...artifactVersions, newVersionHuman]);

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
          selectedText: selectedText || selection,
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
              const newVersion = {
                version: artifactVersions.length === 0 ? '2' : (artifactVersions.length + 2).toString(),
                createdBy: 'ai',
                content: msg.artifact,
              };
              setArtifactVersions([...artifactVersions, newVersionHuman, newVersion]);
              setSelectedVersion(newVersion.version);
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

  const handleVersionChange = (version: string) => {
    setSelectedVersion(version);
    const selectedArtifact = artifactVersions.find(v => v.version === version)?.content || '';
    setArtifact(selectedArtifact);
  };

  const handleChangeDocEditor = () => {
    const newState = !isDocumentEditor;
    setIsDocumentEditor(newState);
    localStorage.setItem("isDocumentEditor", newState.toString());
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
          <div className="flex items-center">
            <select 
              value={selectedVersion} 
              onChange={(e) => handleVersionChange(e.target.value)}
              className="border rounded px-2 py-1 mr-2 version-dropdown"
            >
              {artifactVersions.map(version => (
                <option key={version.version} value={version.version}>
                  {version.version === artifactVersions.length.toString() ? 'latest' : `Version ${version.version}`} ({version.createdBy})
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={handleChangeDocEditor}>
              {isDocumentEditor ? 'Switch to Code Editor' : 'Switch to Document Editor'}
            </Button>
          </div>
        </header>
        {isDocumentEditor ? (
          <DocumentEditor 
            document={artifact} 
            onDocumentChange={(doc) => setArtifact(doc)} 
            onSelectionChange={setSelectedText}
            onComment={(comment, selectedText) => {
              handleSendMessage(comment, selectedText);
            }}
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
