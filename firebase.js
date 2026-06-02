import { initializeApp }                       from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js';
import { getFirestore, collection, addDoc,
         getDocs, query, orderBy, limit,
         serverTimestamp, deleteDoc, doc }      from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey:            "AIzaSyAS7JuXGAc--if8f31VSupObM9yFY7SUOA",
  authDomain:        "notebin-1.firebaseapp.com",
  projectId:         "notebin-1",
  storageBucket:     "notebin-1.firebasestorage.app",
  messagingSenderId: "370068830798",
  appId:             "1:370068830798:web:aab755b21fabf9e460611f"
};

const fbApp     = initializeApp(firebaseConfig);
const db        = getFirestore(fbApp);
const NOTES_COL = 'notes';
const MAX_NOTES = 15;

async function saveNoteToFirebase(dataURL) {
  try {
    const snap = await getDocs(query(collection(db, NOTES_COL), orderBy('createdAt', 'asc')));
    if (snap.size >= MAX_NOTES) {
      await deleteDoc(doc(db, NOTES_COL, snap.docs[0].id));
    }
    await addDoc(collection(db, NOTES_COL), {
      data:      dataURL,
      createdAt: serverTimestamp(),
    });
    console.log('Note saved to Firebase');
  } catch (e) {
    console.error('Firebase save error:', e);
  }
}

async function loadNotesFromFirebase() {
  try {
    const snap = await getDocs(query(collection(db, NOTES_COL), orderBy('createdAt', 'desc'), limit(MAX_NOTES)));
    return snap.docs.map(d => ({ id: d.id, data: d.data().data }));
  } catch (e) {
    console.error('Firebase load error:', e);
    return [];
  }
}

window._fbSaveNote  = saveNoteToFirebase;
window._fbLoadNotes = loadNotesFromFirebase;
