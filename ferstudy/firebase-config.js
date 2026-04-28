// ferstudy/firebase-config.js
// ✅ Firebase com inicialização robusta e completa

const firebaseConfig = {
  apiKey: "AIzaSyCrwApr2CdU59OKwtLZKyHOnksy5DqqW7I",
  authDomain: "ferstudy.firebaseapp.com",
  projectId: "ferstudy",
  storageBucket: "ferstudy.firebasestorage.app",
  messagingSenderId: "815271116137",
  appId: "1:815271116137:web:38bcb7a2661843b0b491f8"
};

console.log("📌 Iniciando Firebase...");

// Aguardar Firebase estar disponível antes de usar
async function initializeFirebase() {
  try {
    // Aguardar Firebase estar disponível (máx 5 segundos)
    let attempts = 0;
    while (typeof firebase === 'undefined' && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (typeof firebase === 'undefined') {
      throw new Error("Firebase CDN não carregou");
    }

    console.log("✅ Firebase CDN detectado");

    // Inicializar Firebase
    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);
      console.log("✅ Firebase app inicializado");
    } else {
      console.log("ℹ️ Firebase já estava inicializado");
    }

    // Acessar serviços
    window.db = firebase.firestore();
    window.auth = firebase.auth();
    
    console.log("✅ Firestore e Auth prontos!");

    // Configurar persistência (salvar login entre recarregar página)
    try {
      await window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      console.log("✅ Persistência: LOCAL (login mantido entre sessões)");
    } catch (persistError) {
      console.warn("⚠️ Persistência LOCAL não disponível, tentando SESSION...", persistError.message);
      try {
        await window.auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
        console.log("✅ Persistência: SESSION (login mantido nesta sessão)");
      } catch (sessionError) {
        console.warn("⚠️ Nenhuma persistência disponível", sessionError.message);
      }
    }

    // Teste de conexão com Firestore
    try {
      await window.db.collection("_test").doc("ping").get();
      console.log("✅ Firestore conectado e respondendo");
    } catch (firestoreError) {
      console.warn("⚠️ Firestore respondeu com erro (normal em teste):", firestoreError.code);
    }

    return true;
  } catch (error) {
    console.error("❌ ERRO CRÍTICO ao inicializar Firebase:", error.message);
    console.error("Stack:", error.stack);
    window.db = null;
    window.auth = null;
    return false;
  }
}

// Iniciar imediatamente quando o script carregar
initializeFirebase().then(success => {
  if (success) {
    console.log("🚀 Firebase pronto para usar!");
  } else {
    console.error("🚀 Firebase com erro, mas continuando mesmo assim...");
  }
}).catch(err => {
  console.error("❌ Erro crítico na inicialização:", err);
});
