import React from 'react';
import './EditorTitle.css'; // Import CSS file for styling

const EditorTitle = (props) => {
  const { title, onTitleChange, onSaveContent } = props;
  return (
    <div className="headerWrapper">
      <input
        className="titleInput"
        placeholder={'Title...'}
        value={title}
        onChange={onTitleChange}
      />
      <button className="saveButton" onClick={onSaveContent}>
        Save
      </button>
    </div>
  );
};

export default EditorTitle;
