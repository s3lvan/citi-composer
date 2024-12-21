import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Switch } from '@/components/ui/switch';
// import './CodeEditor.css';
import Markdown from './ui/markdown';

interface CodeEditorProps {
  code: string;
  onCodeChange: (newCode: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onCodeChange }) => {
  const [isPreviewMode, setIsPreviewMode] = useState(true);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onCodeChange(value);
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-center p-2 border-b">
        <h2 className="text-lg font-bold">Code Editor</h2>
        <div className="flex items-center">
          <label htmlFor="preview-toggle" className="mr-2 text-sm">
            {isPreviewMode ? 'Preview Mode' : 'Editor Mode'}
          </label>
          <Switch
            id="preview-toggle"
            checked={isPreviewMode}
            onCheckedChange={setIsPreviewMode} // Corrected to use `onCheckedChange` if supported by your Switch component
          />
        </div>
      </div>
      {isPreviewMode ? (
        <div className="p-4 overflow-auto markdown-preview">
          <Markdown contents={code} />
        </div>
      ) : (
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={code}
          onChange={handleEditorChange}
          theme="light"
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
          }}
        />
      )}
    </div>
  );
};

export default CodeEditor;
