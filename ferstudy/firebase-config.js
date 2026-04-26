// ferstudy/firebase-config.js
// ✅ Credenciais do Firebase já preenchidas!

const firebaseConfig = {
  apiKey: "AIzaSyCrwApr2CdU59OKwtLZKyHOnksy5DqqW7I",
  authDomain: "ferstudy.firebaseapp.com",
  projectId: "ferstudy",
  storageBucket: "ferstudy.firebasestorage.app",
  messagingSenderId: "815271116137",
  appId: "1:815271116137:web:38bcb7a2661843b0b491f8"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referências do banco e auth
const db = firebase.firestore();
const auth = firebase.auth();

// Disponibilizar globalmente
window.db = db;
window.auth = auth;

console.log("✅ Firebase inicializado com sucesso!");
