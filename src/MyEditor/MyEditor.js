import React, { useState } from 'react';
import {
  Editor,
  EditorState,
  RichUtils,
  getDefaultKeyBinding,
  Modifier,
  ContentBlock,
  ContentState,
  genKey,
  convertFromRaw,
  convertToRaw
} from 'draft-js';
import EditorTitle from './Components/EditorTitle/EditorTitle';

import Immutable from 'immutable';

import 'draft-js/dist/Draft.css';
import './MyEditor.css';

const styleMap = {
  RED: {
    color: 'red'
  }
};

const MyEditor = () => {
  const savedContent = JSON.parse(localStorage.getItem('draftEditor'));

  const initEditorState = savedContent?.content
    ? EditorState.createWithContent(convertFromRaw(savedContent.content))
    : EditorState.createEmpty();

  const [editorState, setEditorState] = useState(initEditorState);
  const [title, setTitle] = useState(savedContent?.title ?? '');

  const onEditorChange = (newEditorState) => {
    setEditorState(newEditorState);
  };

  const onTitleChange = (event) => {
    setTitle(event.target.value);
  };

  const changeBlockTypeForCurrentContent = ({ newBlockType }) => {
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();

    const textRemovedContentState = removeTextFromBlock({ contentState, selection });

    // Use Modifier.setBlockType to change the block type
    const newContentState = Modifier.setBlockType(textRemovedContentState, selection, newBlockType);

    // Push the new content state to create a new EditorState
    const newEditorState = EditorState.push(editorState, newContentState, 'change-block-type');

    // Return the new EditorState
    return newEditorState;
  };

  const removePreviousInlineStyles = ({ editorState }) => {
    const currentInlineStyle = editorState.getCurrentInlineStyle().toArray();
    let prevEditorState = editorState;
    for (const style of currentInlineStyle) {
      prevEditorState = RichUtils.toggleInlineStyle(prevEditorState, style);
    }

    return prevEditorState;
  };

  const toggleInlineStyle = ({ inLineStyle }) => {
    const contentState = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const textRemovedContentState = removeTextFromBlock({ contentState, selection });

    const newEditorState = EditorState.push(editorState, textRemovedContentState, 'remove-range');

    const removedInLineStylesEditorState = removePreviousInlineStyles({
      editorState: newEditorState
    });

    onEditorChange(RichUtils.toggleInlineStyle(removedInLineStylesEditorState, inLineStyle));
  };

  const createEmptyBlock = () => {
    const newBlock = new ContentBlock({
      key: genKey(),
      type: 'unstyled',
      text: '',
      characterList: Immutable.List()
    });

    const contentState = editorState.getCurrentContent();
    const newBlockMap = contentState.getBlockMap().set(newBlock.getKey(), newBlock);

    const newEditorState = EditorState.push(
      editorState,
      ContentState.createFromBlockArray(newBlockMap.toArray()).set(
        'selectionAfter',
        contentState.getSelectionAfter().merge({
          anchorKey: newBlock.getKey(),
          anchorOffset: 0,
          focusKey: newBlock.getKey(),
          focusOffset: 0,
          isBackward: false
        })
      ),
      'split-block'
    );

    const removedInLineStylesEditorState = removePreviousInlineStyles({
      editorState: newEditorState
    });

    return removedInLineStylesEditorState;
  };

  const removeTextFromBlock = ({ contentState, selection }) => {
    const blockKey = selection.getAnchorKey();
    const block = contentState.getBlockForKey(selection.getAnchorKey());

    const startOffset = 0;
    const endOffset = block.getLength();

    // Create a selection range covering the entire block
    const selectionRange = selection.merge({
      anchorKey: blockKey,
      anchorOffset: startOffset,
      focusOffset: endOffset,
      focusKey: blockKey
    });

    const newContentState = Modifier.replaceText(contentState, selectionRange, '');

    return newContentState;
  };

  const handleKeyCommand = (command) => {
    if (command === 'handle-heading') {
      onEditorChange(
        changeBlockTypeForCurrentContent({
          newBlockType: 'header-one'
        })
      );
      return 'handled';
    }
    if (command === 'handle-code-block') {
      onEditorChange(
        changeBlockTypeForCurrentContent({
          newBlockType: 'code-block'
        })
      );
      return 'handled';
    }
    if (command === 'split-block') {
      onEditorChange(createEmptyBlock());
      return 'handled';
    }
    if (command === 'handle-bold') {
      toggleInlineStyle({ inLineStyle: 'BOLD' });
      return 'handled';
    }
    if (command === 'handle-red-line') {
      toggleInlineStyle({ inLineStyle: 'RED' });
      return 'handled';
    }
    if (command === 'handle-under-line') {
      toggleInlineStyle({ inLineStyle: 'UNDERLINE' });
      return 'handled';
    }

    return 'not-handled';
  };

  const mapKeyToEditorCommand = (e) => {
    if (e.keyCode === 32 /* SPACE */) {
      const contentState = editorState.getCurrentContent();
      const selection = editorState.getSelection();
      const block = contentState.getBlockForKey(selection.getStartKey());
      const blockText = block.getText().trim();

      switch (blockText) {
        case '#':
          return 'handle-heading';
        case '*':
          return 'handle-bold';
        case '**':
          return 'handle-red-line';
        case '***':
          return 'handle-under-line';
        case '```':
          return 'handle-code-block';
        default:
          break;
      }
    }
    return getDefaultKeyBinding(e);
  };

  const getBlockStyle = (block) => {
    switch (block.getType()) {
      case 'code-block':
        return 'richEditorCodeBlock';
      default:
        return null;
    }
  };

  const onSaveContent = () => {
    localStorage.setItem(
      'draftEditor',
      JSON.stringify({
        title: title,
        content: convertToRaw(editorState.getCurrentContent())
      })
    );
  };

  return (
    <div className="editorWrapper">
      <EditorTitle title={title} onTitleChange={onTitleChange} onSaveContent={onSaveContent} />
      <div className="editorContainer">
        <Editor
          blockStyleFn={getBlockStyle}
          editorState={editorState}
          customStyleMap={styleMap}
          onChange={onEditorChange}
          handleKeyCommand={handleKeyCommand}
          keyBindingFn={mapKeyToEditorCommand}
          placeholder={'Tell a Story...'}
        />
      </div>
    </div>
  );
};

export default MyEditor;
