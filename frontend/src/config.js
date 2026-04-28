import { db, storage } from "./firebase";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Remplace uploadArchive (POST api/archives/upload)
export const uploadArchive = async (file, metadata) => {
  const storageRef = ref(storage, `archives/${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  await addDoc(collection(db, "archives"), {
    ...metadata,
    fileUrl: url,
    fileName: file.name,
    createdAt: serverTimestamp()
  });
  return url;
};

// Remplace getArchives (GET api/archives)
export const getArchives = async () => {
  const snapshot = await getDocs(collection(db, "archives"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Remplace getUsers (GET api/users)
export const getUsers = async () => {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};