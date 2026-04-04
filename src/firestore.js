import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

// Récupérer toutes les offres
export async function getOffers(category = "") {
  const offersRef = collection(db, "offers");
  let q = query(offersRef, orderBy("createdAt", "desc"));
  if (category) {
    q = query(offersRef, where("cat", "==", category), orderBy("createdAt", "desc"));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Créer une offre
export async function createOffer(offerData) {
  const offersRef = collection(db, "offers");
  const docRef = await addDoc(offersRef, {
    ...offerData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}