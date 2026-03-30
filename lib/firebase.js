require("dotenv").config();
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, getDocs, deleteDoc, query, orderBy } = require("firebase/firestore");

// La configuration provient des variables d'environnement (soit du .env local, soit de Vercel)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialiser l'application Firebase (seulement si la clé principale est présente)
let db = null;
if (firebaseConfig.apiKey) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} else {
  console.warn("⚠️  Les variables d'environnement Firebase sont manquantes !");
}

module.exports = {
  db,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy
};
