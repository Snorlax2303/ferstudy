// ferstudy/firebase-config.js
// ✅ Firebase inicializado corretamente!

const firebaseConfig = {
  apiKey: "AIzaSyCrwApr2CdU59OKwtLZKyHOnksy5DqqW7I",
  authDomain: "ferstudy.firebaseapp.com",
  projectId: "ferstudy",
  storageBucket: "ferstudy.firebasestorage.app",
  messagingSenderId: "815271116137",
  appId: "1:815271116137:web:38bcb7a2661843b0b491f8"
};

// Inicializar Firebase ANTES de usar
try {
  firebase.initializeApp(firebaseConfig);
  console.log("✅ Firebase inicializado com sucesso!");
} catch (error) {
  console.error("❌ Erro ao inicializar Firebase:", error);
}

// Esperar Firebase estar pronto
let db = null;
let auth = null;

// Tentar acessar depois de um delay para garantir que Firebase carregou
setTimeout(() => {
  try {
    db = firebase.firestore();
    auth = firebase.auth();
    
    window.db = db;
    window.auth = auth;
    
    console.log("✅ Firestore e Auth disponíveis!");
  } catch (error) {
    console.error("❌ Erro ao acessar Firestore/Auth:", error);
  }
}, 100);

// Exportar também se precisar
window.firebaseConfig = firebaseConfig;
