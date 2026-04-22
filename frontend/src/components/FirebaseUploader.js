import React, { useState } from "react";
import { storage, app } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const db = getFirestore(app);

export default function FirebaseUploader() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const storageRef = ref(storage, `documents/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setUrl(downloadURL);
      await addDoc(collection(db, "documents"), {
        name: file.name,
        url: downloadURL,
        uploadedAt: new Date()
      });
    } catch (error) {
      alert("Erreur lors de l'upload : " + error.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <input type="file" onChange={handleChange} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Envoi en cours..." : "Uploader"}
      </button>
      {url && (
        <div>
          <p>Fichier disponible ici :</p>
          <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
        </div>
      )}
    </div>
  );
}