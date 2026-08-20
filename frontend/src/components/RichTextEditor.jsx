import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Italic, List, ListOrdered, Underline } from 'lucide-react';
import { useEffect, useRef } from 'react';

const TOOLBAR = [
  { command: 'bold', label: 'Bold', Icon: Bold },
  { command: 'italic', label: 'Italic', Icon: Italic },
  { command: 'underline', label: 'Underline', Icon: Underline },
  { command: 'insertUnorderedList', label: 'Bulleted list', Icon: List },
  { command: 'insertOrderedList', label: 'Numbered list', Icon: ListOrdered },
  { command: 'justifyLeft', label: 'Align left', Icon: AlignLeft },
  { command: 'justifyCenter', label: 'Align center', Icon: AlignCenter },
  { command: 'justifyRight', label: 'Align right', Icon: AlignRight },
  { command: 'justifyFull', label: 'Justify', Icon: AlignJustify },
];

function applyCommand(command, value = null) {
  document.execCommand(command, false, value);
}

export function RichTextEditor({ value = '', onChange, placeholder, maxLength = 5000 }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  function handleInput() {
    const html = editorRef.current?.innerHTML ?? '';
    onChange?.(html.slice(0, maxLength));
  }

  function handleToolbarMouseDown(event, command, commandValue = null) {
    event.preventDefault();
    editorRef.current?.focus();
    applyCommand(command, commandValue);
    handleInput();
  }

  return (
    <div className="rich-text-editor">
      <div className="rich-text-editor__toolbar" role="toolbar" aria-label="Text formatting">
        {TOOLBAR.map(({ command, label, Icon }) => (
          <button
            key={command}
            type="button"
            className="rich-text-editor__tool"
            title={label}
            aria-label={label}
            onMouseDown={(event) => handleToolbarMouseDown(event, command)}
          >
            <Icon size={15} strokeWidth={2.3} />
          </button>
        ))}
        <select
          className="rich-text-editor__select"
          aria-label="Font family"
          defaultValue=""
          onChange={(event) => {
            editorRef.current?.focus();
            applyCommand('fontName', event.target.value);
            handleInput();
            event.target.value = '';
          }}
        >
          <option value="">Font</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
          <option value="Trebuchet MS">Trebuchet</option>
        </select>
        <select
          className="rich-text-editor__select"
          aria-label="Font size"
          defaultValue=""
          onChange={(event) => {
            editorRef.current?.focus();
            applyCommand('fontSize', event.target.value);
            handleInput();
            event.target.value = '';
          }}
        >
          <option value="">Size</option>
          <option value="2">Small</option>
          <option value="3">Normal</option>
          <option value="4">Large</option>
          <option value="5">XL</option>
        </select>
      </div>
      <div
        ref={editorRef}
        className="rich-text-editor__surface"
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={handleInput}
        suppressContentEditableWarning
      />
    </div>
  );
}
