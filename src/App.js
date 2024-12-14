import React, { useState } from 'react';

function App() {
  const [notes, setNotes] = useState([
    { id: 1, content: 'This is your first note.' },
  ]);

  const [selectedNote, setSelectedNote] = useState(notes[0]);

  const handleNoteClick = (note) => {
    setSelectedNote(note);
  };

  const handleContentChange = (event) => {
    const updatedNote = { ...selectedNote, content: event.target.value };
    setSelectedNote(updatedNote);

    setNotes(
      notes.map((note) => (note.id === selectedNote.id ? updatedNote : note))
    );
  };

  const handleCreateNote = () => {
    const newNote = {
      id: notes.length + 1,
      content: '',
    };
    setNotes([...notes, newNote]);
    setSelectedNote(newNote);
  };

  const getNoteTitle = (content) => {
    const firstLine = content.split('\n')[0];
    return firstLine || 'Untitled Note';
  };

  return (
    <div className="flex h-screen font-roboto">
      {/* Left Sidebar */}
      <div className="w-1/3 bg-gray-50 shadow-md flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-400 text-white text-xl font-bold">
          📝 Notes
        </div>

        {/* Notes List */}
        <div className="flex-grow overflow-y-auto p-4 space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`p-3 bg-gray-100 rounded-lg shadow cursor-pointer hover:bg-gray-200 transition ${
                selectedNote.id === note.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleNoteClick(note)}
            >
              {getNoteTitle(note.content)}
            </div>
          ))}
        </div>

        {/* Create Note Button */}
        <div className="p-4">
          <button
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg shadow hover:shadow-lg hover:bg-blue-600 transition"
            onClick={handleCreateNote}
          >
            Create Note
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="w-[1px] bg-gray-300"></div>

      {/* Right Column */}
      <div className="flex-grow bg-gray-50 p-4">
        {selectedNote ? (
          <textarea
            className="w-full h-full border border-gray-300 rounded-lg p-4 text-lg leading-relaxed focus:ring-2 focus:ring-blue-500 shadow-sm"
            value={selectedNote.content}
            onChange={handleContentChange}
          />
        ) : (
          <p className="text-gray-500">Select a note to edit</p>
        )}
      </div>
    </div>
  );
}

export default App;
