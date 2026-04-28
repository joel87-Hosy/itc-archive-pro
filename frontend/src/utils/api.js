import { db, storage } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// ─── ARCHIVES ───────────────────────────────────────────────────────────────

export const getArchives = async () => {
  const q = query(collection(db, "archives"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const uploadArchive = async (file, metadata) => {
  const storageRef = ref(storage, `archives/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const fileUrl = await getDownloadURL(storageRef);
  await addDoc(collection(db, "archives"), {
    ...metadata,
    fileUrl,
    fileName: file.name,
    createdAt: serverTimestamp()
  });
  return fileUrl;
};

export const deleteArchive = async (id, fileName) => {
  await deleteDoc(doc(db, "archives", id));
  const storageRef = ref(storage, `archives/${fileName}`);
  await deleteObject(storageRef);
};

// ─── UTILISATEURS ───────────────────────────────────────────────────────────

export const getUsers = async () => {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addUser = async (userData) => {
  await addDoc(collection(db, "users"), {
    ...userData,
    createdAt: serverTimestamp()
  });
};

// ─── COMPATIBILITÉ ──────────────────────────────────────────────────────────
export const buildApiUrl = (path = "") => {
  console.warn(`buildApiUrl("${path}") est déprécié. Utilise les fonctions Firebase.`);
  return path;
};

export const getApiBaseUrl = () => {
  console.warn("getApiBaseUrl() est déprécié. Utilise Firebase.");
  return "";
};
