import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const handleSubmit = async (formData) => {
  // Enregistrer dans le localStorage
  await addDoc(collection(db, "documents"), {
    titre: formData.titre,
    type: formData.type,
    date: formData.date,
    description: formData.description,
    auteur: formData.auteur,
    departement: formData.departement,
    createdAt: serverTimestamp(),
  });

  // Sauvegarder dans Firestore
  await addDoc(collection(db, "documents"), {
    titre: formData.titre,
    type: formData.type,
    date: formData.date,
    description: formData.description,
    auteur: formData.auteur,
    departement: formData.departement,
    createdAt: serverTimestamp(),
  });
};