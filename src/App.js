import React, { useState, useEffect } from "react";
import { db, auth, actionCodeSettings } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  signOut,
  onAuthStateChanged,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";

function App() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [user, setUser] = useState(null); // Track authenticated user
  const [email, setEmail] = useState(""); // Email input
  const [password, setPassword] = useState(""); // Password input
  const [emailLinkSent, setEmailLinkSent] = useState(false); // Track email link state

  // Track auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Handle email link sign-in
  useEffect(() => {
    const handleEmailLinkSignIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = localStorage.getItem("emailForSignIn");
        if (!email) {
          email = prompt("Please provide your email for confirmation");
        }
        try {
          const result = await signInWithEmailLink(auth, email, window.location.href);
          localStorage.removeItem("emailForSignIn");
          console.log("Successfully signed in:", result.user);
        } catch (error) {
          console.error("Error signing in with email link:", error);
        }
      }
    };
    handleEmailLinkSignIn();
  }, []);

  // Fetch notes
  useEffect(() => {
    if (!user) return;

    const fetchNotes = async () => {
      const notesCollection = collection(db, `users/${user.uid}/notes`);
      const notesSnapshot = await getDocs(notesCollection);
      const notesList = notesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotes(notesList);
      if (notesList.length > 0) setSelectedNote(notesList[0]);
    };
    fetchNotes();
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
      setEmailLinkSent(true);
    } catch (error) {
      console.error("Error sending magic link:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setNotes([]);
      setSelectedNote(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleCreateNote = async () => {
    if (!user) return;
    const newNote = { content: "" };
    const docRef = await addDoc(collection(db, `users/${user.uid}/notes`), newNote);
    const createdNote = { id: docRef.id, ...newNote };
    setNotes((prev) => [...prev, createdNote]);
    setSelectedNote(createdNote);
  };

  const handleContentChange = async (event) => {
    if (!selectedNote || !user) return;

    const updatedContent = event.target.value;
    const updatedNote = { ...selectedNote, content: updatedContent };
    setSelectedNote(updatedNote);

    const noteRef = doc(db, `users/${user.uid}/notes`, selectedNote.id);
    await updateDoc(noteRef, { content: updatedContent });

    setNotes((prev) =>
      prev.map((note) =>
        note.id === selectedNote.id ? { ...note, content: updatedContent } : note
      )
    );
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        {!emailLinkSent ? (
          <div className="flex flex-col space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="border p-2 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="border p-2 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              className="bg-blue-500 text-white py-2 px-4 rounded-lg"
              onClick={handleSignIn}
            >
              Sign In
            </button>
            <button
              className="bg-green-500 text-white py-2 px-4 rounded-lg"
              onClick={handleSignUp}
            >
              Sign Up
            </button>
            <button
              className="bg-purple-500 text-white py-2 px-4 rounded-lg"
              onClick={handleSendMagicLink}
            >
              Sign in with Magic Link
            </button>
          </div>
        ) : (
          <p>Magic link sent to your email. Check your inbox to log in.</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen font-roboto">
      <div className="w-1/3 bg-gray-50 shadow-md flex flex-col">
        <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-400 text-white text-xl font-bold flex items-center justify-between">
          📝 Notes
          <button
            className="text-sm bg-red-500 py-1 px-2 rounded-lg"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
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
