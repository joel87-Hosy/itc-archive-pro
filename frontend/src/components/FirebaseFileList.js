import React, { useEffect, useState } from "react";
import { app } from "../firebase";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";

const db = getFirestore(app);

export default function FirebaseFileList() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      const q = query(collection(db, "documents"), orderBy("uploadedAt", "desc"));
      const querySnapshot = await getDocs(q);
      setDocs(
        querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      );
      setLoading(false);
    };
    fetchDocs();
  }, []);

  if (loading) return <p>Chargement...</p>;
  if (docs.length === 0) return <p>Aucun document trouvé.</p>;

  return (
    <div>
      <h2>Documents uploadés</h2>
      <ul>
        {docs.map(doc => (
          <li key={doc.id}>
            <a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}