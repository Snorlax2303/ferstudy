// ferstudy/firebase-config.js
// ✅ Firebase COMPLETO - Com measurementId

const firebaseConfig = {
  apiKey: "AIzaSyCrwApr2CdU59OKwtLZKyHOnksy5DqqW7I",
  authDomain: "ferstudy.firebaseapp.com",
  projectId: "ferstudy",
  storageBucket: "ferstudy.firebasestorage.app",
  messagingSenderId: "815271116137",
  appId: "1:815271116137:web:38bcb7a2661843b0b491f8",
  measurementId: "G-3NSWQQYNVY"
};

console.log("📌 [FIREBASE] Config completo carregado com measurementId");
console.log("🔧 [FIREBASE] Iniciando Firebase...");

// Flag de status
window.firebaseReady = false;
window.firebaseError = null;
window.firebaseStartTime = Date.now();

// ===== INICIALIZAR FIREBASE =====
function initializeFirebase() {
  try {
    // Verificar se firebase está disponível
    if (typeof firebase === 'undefined') {
      throw new Error("Firebase não foi carregado via CDN");
    }

    console.log("✅ [FIREBASE] Firebase CDN disponível");

    // Verificar se já foi inicializado
    if (firebase.apps && firebase.apps.length > 0) {
      console.log("ℹ️ [FIREBASE] Firebase já estava inicializado");
      window.db = firebase.firestore();
      window.auth = firebase.auth();
      window.firebaseReady = true;
      console.log("🚀 [FIREBASE] Usando instância existente");
      return true;
    }

    // Inicializar Firebase
    console.log("🔧 [FIREBASE] Executando firebase.initializeApp()...");
    const app = firebase.initializeApp(firebaseConfig);
    console.log("✅ [FIREBASE] initializeApp() executado com sucesso");

    // Acessar Firestore
    try {
      window.db = firebase.firestore();
      console.log("✅ [FIREBASE] Firestore inicializado");
    } catch (err) {
      console.error("❌ [FIREBASE] Erro ao acessar Firestore:", err.message);
      throw err;
    }

    // Acessar Auth
    try {
      window.auth = firebase.auth();
      console.log("✅ [FIREBASE] Auth inicializado");
    } catch (err) {
      console.error("❌ [FIREBASE] Erro ao acessar Auth:", err.message);
      throw err;
    }

    // Configurar persistência
    try {
      window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
          console.log("✅ [FIREBASE] Persistência LOCAL ativada");
        })
        .catch(err => {
          console.warn("⚠️ [FIREBASE] LOCAL persistência falhou, tentando BROWSER...");
          return window.auth.setPersistence(firebase.auth.Auth.Persistence.BROWSER);
        })
        .catch(err => {
          console.warn("⚠️ [FIREBASE] BROWSER persistência também falhou");
        });
    } catch (err) {
      console.warn("⚠️ [FIREBASE] Erro ao configurar persistência:", err.message);
    }

    window.firebaseReady = true;
    const elapsed = Date.now() - window.firebaseStartTime;
    console.log(`🚀 [FIREBASE] INICIALIZAÇÃO COMPLETA! (${elapsed}ms)`);
    
    return true;

  } catch (error) {
    console.error("❌ [FIREBASE] ERRO NA INICIALIZAÇÃO:", error.message);
    console.error("Stack:", error);
    window.firebaseError = error.message;
    window.firebaseReady = false;
    return false;
  }
}

// ===== TENTAR INICIALIZAR =====
console.log("⏳ [FIREBASE] Aguardando Firebase CDN...");

if (typeof firebase !== 'undefined') {
  console.log("✅ [FIREBASE] Firebase já está disponível, inicializando agora...");
  initializeFirebase();
} else {
  // Esperar Firebase carregar
  let attempts = 0;
  const maxAttempts = 200; // 20 segundos
  
  const waitInterval = setInterval(() => {
    attempts++;
    
    if (typeof firebase !== 'undefined') {
      clearInterval(waitInterval);
      console.log(`✅ [FIREBASE] Firebase disponível na tentativa ${attempts}`);
      initializeFirebase();
    } else if (attempts >= maxAttempts) {
      clearInterval(waitInterval);
      console.error("❌ [FIREBASE] TIMEOUT: Firebase não carregou em 20 segundos");
      window.firebaseError = "Firebase CDN não carregou no tempo esperado";
      window.firebaseReady = false;
    }
  }, 100);
}

// ===== FUNÇÃO DE DEBUG =====
window.firebaseDebug = {
  checkStatus: () => {
    console.group("🔍 FIREBASE STATUS");
    console.log("Firebase CDN:", typeof firebase !== 'undefined' ? "✅ CARREGADO" : "❌ NÃO CARREGADO");
    console.log("window.db:", typeof window.db !== 'undefined' ? "✅ OK" : "❌ NÃO INICIALIZADO");
    console.log("window.auth:", typeof window.auth !== 'undefined' ? "✅ OK" : "❌ NÃO INICIALIZADO");
    console.log("firebaseReady:", window.firebaseReady ? "✅ SIM" : "❌ NÃO");
    console.log("firebaseError:", window.firebaseError || "Nenhum erro");
    
    if (typeof firebase !== 'undefined' && firebase.apps) {
      console.log("Firebase Apps Count:", firebase.apps.length);
      firebase.apps.forEach((app, i) => {
        console.log(`  App ${i}: ${app.name}`);
      });
    }
    
    const elapsed = Date.now() - window.firebaseStartTime;
    console.log(`Tempo decorrido: ${elapsed}ms`);
    console.groupEnd();
  },
  
  testAuth: async () => {
    console.group("🔐 TESTE DE AUTENTICAÇÃO");
    try {
      if (!window.auth) {
        throw new Error("Auth não inicializado");
      }
      const user = window.auth.currentUser;
      console.log("Usuário atual:", user ? user.email : "Nenhum");
      console.groupEnd();
    } catch (err) {
      console.error("❌ Erro:", err.message);
      console.groupEnd();
    }
  },
  
  testFirestore: async () => {
    console.group("📊 TESTE DE FIRESTORE");
    try {
      if (!window.db) {
        throw new Error("Firestore não inicializado");
      }
      const test = await window.db.collection("_test").doc("ping").get();
      console.log("✅ Firestore respondeu (teste)");
      console.groupEnd();
    } catch (err) {
      console.error("❌ Erro:", err.code);
      console.groupEnd();
    }
  }
};

console.log("💡 [FIREBASE] Use window.firebaseDebug.checkStatus() para debug");
console.log("💡 [FIREBASE] Use window.firebaseDebug.testAuth() para testar Auth");
console.log("💡 [FIREBASE] Use window.firebaseDebug.testFirestore() para testar Firestore");
