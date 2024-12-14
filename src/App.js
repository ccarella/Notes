import React, { useState, useEffect } from "react";
import db from "./firebase";
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";

function App() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);

  // Fetch notes from Firestore
  useEffect(() => {
    const fetchNotes = async () => {
      const notesCollection = collection(db, "notes");
      const notesSnapshot = await getDocs(notesCollection);
      const notesList = notesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotes(notesList);
      if (notesList.length > 0) setSelectedNote(notesList[0]);
    };
    fetchNotes();
  }, []);

  const handleCreateNote = async () => {
    const newNote = { content: "" };
    const docRef = await addDoc(collection(db, "notes"), newNote);
    const createdNote = { id: docRef.id, ...newNote };
    setNotes((prev) => [...prev, createdNote]);
    setSelectedNote(createdNote);
  };

  const handleContentChange = async (event) => {
    const updatedContent = event.target.value;
    if (!selectedNote) return;

    const updatedNote = { ...selectedNote, content: updatedContent };
    setSelectedNote(updatedNote);

    // Update Firestore
    const noteRef = doc(db, "notes", selectedNote.id);
    await updateDoc(noteRef, { content: updatedContent });

    // Update local state
    setNotes((prev) =>
      prev.map((note) =>
        note.id === selectedNote.id ? { ...note, content: updatedContent } : note
      )
    );
  };

  return (
    <div className="flex h-screen font-roboto">
      {/* Left Sidebar */}
      <div className="w-1/3 bg-gray-50 shadow-md flex flex-col">
        <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-400 text-white text-xl font-bold flex items-center">
          📝 Notes
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`p-3 bg-gray-100 rounded-lg shadow cursor-pointer hover:bg-gray-200 transition ${
                selectedNote?.id === note.id ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => setSelectedNote(note)}
            >
              {note.content.split("\n")[0] || "Untitled Note"}
            </div>
          ))}
        </div>
        <div className="p-4">
          <button
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg shadow hover:shadow-lg hover:bg-blue-600 transition"
            onClick={handleCreateNote}
          >
            Create Note
          </button>
        </div>
      </div>

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
