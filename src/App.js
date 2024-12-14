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
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [view, setView] = useState("list"); // "list" or "details"

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

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
    setView("details");
  };

  const handleContentChange = async (event) => {
    if (!selectedNote || !user) return;

    const updatedContent = event.target.value;
    const updatedNote = { ...selectedNote, content: updatedContent };
    setSelectedNote(updatedNote);

    const noteRef = doc(db, `users/${user.uid}/notes`, selectedNote.id);
    await updateDoc(noteRef, { content: updatedContent });
  };

  const handleBackToList = () => {
    setView("list");
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col space-y-4 w-full max-w-md p-6">
          <input
            type="email"
            placeholder="Email"
            className="border p-3 rounded-lg text-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="border p-3 rounded-lg text-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white py-2 px-4 rounded-lg text-lg font-medium"
            onClick={handleSignIn}
          >
            Sign In
          </button>
          <button
            className="bg-green-500 text-white py-2 px-4 rounded-lg text-lg font-medium"
            onClick={handleSignUp}
          >
            Sign Up
          </button>
          <button
            className="bg-purple-500 text-white py-2 px-4 rounded-lg text-lg font-medium"
            onClick={handleSendMagicLink}
          >
            Send Magic Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen font-roboto">
      {view === "list" ? (
        <div className="w-full bg-gray-50 shadow-md">
          <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-400 text-white text-xl font-bold">
            📝 Notes
          </div>
          <div className="flex-grow overflow-y-auto p-4 space-y-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`p-3 bg-gray-100 rounded-lg shadow cursor-pointer hover:bg-gray-200 transition`}
                onClick={() => {
                  setSelectedNote(note);
                  setView("details");
                }}
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
      ) : (
        <div className="flex flex-col w-full h-screen bg-white">
          {/* Updated Header */}
          <div className="p-4 bg-gray-100 shadow-sm flex items-center space-x-4">
            <button
              className="text-blue-500 text-lg font-medium"
              onClick={handleBackToList}
            >
              &lt; Back
            </button>
            <h1 className="text-xl font-semibold">{selectedNote?.content.split("\n")[0] || "Untitled Note"}</h1>
          </div>

          {/* Note Editor */}
          <textarea
            className="flex-grow w-full border-0 p-4 text-lg focus:ring-0 focus:outline-none"
            placeholder="Start typing..."
            value={selectedNote?.content || ""}
            onChange={handleContentChange}
          />
        </div>
      )}
    </div>
  );
}

export default App;
