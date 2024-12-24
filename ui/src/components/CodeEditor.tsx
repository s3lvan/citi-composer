import React, { useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Switch } from '@/components/ui/switch';
import Markdown from './ui/markdown';

interface CodeEditorProps {
  code: string;
  onCodeChange: (newCode: string) => void;
  onComment: (comment: string, selectedText: string) => void; // <-- Add this prop
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onCodeChange, onComment }) => {
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const editorRef = useRef<any>(null);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onCodeChange(value);
    }
  };

  // Called when the Monaco Editor mounts
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Register custom action for "Improve text with AI"
    editor.addAction({
      id: 'improve-text-action',
      label: 'Improve text with AI',
      contextMenuGroupId: 'navigation',
      run: async (editorInstance) => {
        const selection = editorInstance.getSelection();
        if (!selection) return;

        const selectedText = editorInstance
          .getModel()
          ?.getValueInRange(selection);

        if (!selectedText) return;

        showPopupWidget(editorInstance, monaco, selection, selectedText);
      },
    });
  };

  // Helper that shows the popup widget in the editor
  const showPopupWidget = (
    editor: any,
    monaco: any,
    selection: any,
    selectedText: string
  ) => {
    const widgetId = 'ai-improve-popup';

    // Create DOM node for the popup
    const domNode = document.createElement('div');
    domNode.style.background = '#ffffff';
    domNode.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.15)';
    domNode.style.border = '1px solid #dedede';
    domNode.style.padding = '12px';
    domNode.style.borderRadius = '6px';
    domNode.style.width = '280px';
    domNode.style.zIndex = '9999';
    domNode.style.fontFamily = 'sans-serif';
    domNode.style.fontSize = '14px';

    // Inner HTML for the popup
    domNode.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: 600;">Your comment:</div>
      <textarea
        id="userComment"
        rows="3"
        style="width: 100%; resize: none; padding: 8px; box-sizing: border-box; margin-bottom: 16px;"
        placeholder="Add a comment..."
      ></textarea>

      <div style="display: flex; justify-content: flex-end; gap: 8px;">
        <button
          id="cancelButton"
          style="background: #e2e2e2; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;"
        >
          Cancel
        </button>
        <button
          id="improveButton"
          style="background: #007acc; border: none; padding: 8px 12px; border-radius: 4px; color: #fff; cursor: pointer;"
        >
          Improve
        </button>
      </div>
    `;

    // Create the content widget
    const contentWidget = {
      getId: () => widgetId,
      getDomNode: () => domNode,
      getPosition: () => {
        return {
          position: {
            lineNumber: selection.startLineNumber,
            column: selection.startColumn,
          },
          preference: [monaco.editor.ContentWidgetPositionPreference.EXACT],
        };
      },
    };

    // Add widget to the editor
    editor.addContentWidget(contentWidget);

    // Function to remove the widget
    function removeWidget() {
      editor.removeContentWidget(contentWidget);
      document.removeEventListener('mousedown', handleOutsideClick);
    }

    // Hide the popup if user clicks outside it
    function handleOutsideClick(e: MouseEvent) {
      if (!domNode.contains(e.target as Node)) {
        removeWidget();
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);

    // Attach logic to buttons
    const cancelButton = domNode.querySelector('#cancelButton') as HTMLButtonElement;
    const improveButton = domNode.querySelector('#improveButton') as HTMLButtonElement;

    cancelButton.addEventListener('click', () => {
      removeWidget();
    });

    improveButton.addEventListener('click', () => {
      const userComment = (domNode.querySelector('#userComment') as HTMLTextAreaElement).value;

      // Here is where we call the onComment prop.
      onComment(userComment, selectedText);

      removeWidget();
    });
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
            onCheckedChange={setIsPreviewMode}
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
          defaultLanguage="markdown"
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
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
