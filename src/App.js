import React, { useState, useEffect } from "react";
import { db, auth, actionCodeSettings } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  onAuthStateChanged,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";
import "./App.css";

function getNoteTitle(htmlContent) {
  const text = htmlContent
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .trim();
  const lines = text.split("\n").filter(Boolean);
  return lines[0] || "Untitled Note";
}

function App() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [view, setView] = useState("list");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleEmailLinkSignIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let storedEmail = localStorage.getItem("emailForSignIn") || prompt("Please provide your email for confirmation");
        try {
          await signInWithEmailLink(auth, storedEmail, window.location.href);
          localStorage.removeItem("emailForSignIn");
        } catch (error) {
          console.error("Error signing in with email link:", error);
        }
      }
    };
    handleEmailLinkSignIn();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const notesCollection = collection(db, `users/${user.uid}/notes`);
      const notesSnapshot = await getDocs(notesCollection);
      const notesList = notesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotes(notesList);
      if (notesList.length > 0) setSelectedNote(notesList[0]);
    })();
  }, [user]);

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing up:", error);
    }
  };

  const handleSendMagicLink = async () => {
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      localStorage.setItem("emailForSignIn", email);
    } catch (error) {
      console.error("Error sending magic link:", error);
    }
  };

  const handleCreateNote = async () => {
    if (!user) return;
    const newNote = { content: "" };
    const docRef = await addDoc(collection(db, `users/${user.uid}/notes`), newNote);
    const createdNote = { id: docRef.id, ...newNote };
    setNotes((prev) => [...prev, createdNote]);
    setSelectedNote(createdNote);
    setView("details");
  };

  const handleDeleteNote = async (noteId) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/notes`, noteId));
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote(null);
      setView("list");
    }
  };

  const editor = useEditor({
    extensions: [StarterKit, BulletList, ListItem],
    content: selectedNote?.content || "",
    onUpdate: async ({ editor }) => {
      if (!selectedNote || !user) return;
      const updatedContent = editor.getHTML();
      setSelectedNote((prev) => ({ ...prev, content: updatedContent }));
      const noteRef = doc(db, `users/${user.uid}/notes`, selectedNote.id);
      await updateDoc(noteRef, { content: updatedContent });
    },
  });

  const handleBackToList = () => setView("list");

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col space-y-4 w-full max-w-md p-6 bg-white shadow rounded">
          <input
            type="email"
            placeholder="Email"
            className="border p-3 rounded text-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="border p-3 rounded text-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white py-2 px-4 rounded text-lg font-medium hover:bg-blue-600 transition"
            onClick={handleSignIn}
          >
            Sign In
          </button>
          <button
            className="bg-green-500 text-white py-2 px-4 rounded text-lg font-medium hover:bg-green-600 transition"
            onClick={handleSignUp}
          >
            Sign Up
          </button>
          <button
            className="bg-purple-500 text-white py-2 px-4 rounded text-lg font-medium hover:bg-purple-600 transition"
            onClick={handleSendMagicLink}
          >
            Send Magic Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {view === "list" ? (
        <div className="sidebar">
          <div className="sidebar-header">📝 Notes</div>
          <div className="sidebar-content">
            {notes.map((note) => (
              <div key={note.id} className="note-item">
                <div
                  className="flex-1"
                  onClick={() => {
                    setSelectedNote(note);
                    setView("details");
                  }}
                >
                  {getNoteTitle(note.content)}
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="delete-button"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
          <div className="p-4">
            <button className="create-button" onClick={handleCreateNote}>
              Create Note
            </button>
          </div>
        </div>
      ) : (
        <div className="details-container">
          <div className="details-header">
            <button onClick={handleBackToList}>&lt; Back</button>
            <h1 className="details-title">
              {selectedNote ? getNoteTitle(selectedNote.content) : "Untitled Note"}
            </h1>
          </div>
          {editor && (
            <div className="editor-toolbar">
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive("bulletList") ? "active" : ""}
              >
                Bullet List
              </button>
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive("bold") ? "active" : ""}
              >
                Bold
              </button>
            </div>
          )}
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
}

export default App;
