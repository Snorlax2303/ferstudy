// ferstudy/firebase-config.js
// ✅ Firebase com inicialização robusta

const firebaseConfig = {
  apiKey: "AIzaSyCrwApr2CdU59OKwtLZKyHOnksy5DqqW7I",
  authDomain: "ferstudy.firebaseapp.com",
  projectId: "ferstudy",
  storageBucket: "ferstudy.firebasestorage.app",
  messagingSenderId: "815271116137",
  appId: "1:815271116137:web:38bcb7a2661843b0b491f8"
};

console.log("📌 Iniciando Firebase...");

// Inicializar Firebase
try {
  if (!firebase.apps || firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase app inicializado");
  }
} catch (error) {
  console.error("❌ Erro ao inicializar Firebase:", error.message);
}

// Acessar serviços
try {
  window.db = firebase.firestore();
  window.auth = firebase.auth();
  console.log("✅ Firestore e Auth prontos!");
} catch (error) {
  console.error("❌ Erro ao acessar serviços:", error.message);
  // Se falhar, criar placeholders
  window.db = null;
  window.auth = null;
}
