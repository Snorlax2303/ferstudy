// ferstudy/firebase-config.js
// ✅ Firebase com inicialização robusta - VERSÃO MELHORADA

const firebaseConfig = {
  apiKey: "AIzaSyCrwApr2CdU59OKwtLZKyHOnksy5DqqW7I",
  authDomain: "ferstudy.firebaseapp.com",
  projectId: "ferstudy",
  storageBucket: "ferstudy.firebasestorage.app",
  messagingSenderId: "815271116137",
  appId: "1:815271116137:web:38bcb7a2661843b0b491f8"
};

console.log("📌 INICIANDO FIREBASE CONFIG...");
console.log("Verificando se Firebase está disponível...");

// Verificar se Firebase está carregado
if (typeof firebase === 'undefined') {
  console.error("❌ Firebase NÃO está carregado! Aguardando...");
} else {
  console.log("✅ Firebase detectado imediatamente!");
}

// Função para tentar inicializar
function tryInitialize() {
  try {
    console.log("🔍 Tentativa de inicializar Firebase...");
    console.log("typeof firebase:", typeof firebase);
    
    if (typeof firebase === 'undefined') {
      console.warn("⚠️ Firebase ainda não disponível");
      return false;
    }

    // Verificar se já foi inicializado
    if (firebase.apps && firebase.apps.length > 0) {
      console.log("ℹ️ Firebase já estava inicializado");
      window.db = firebase.firestore();
      window.auth = firebase.auth();
      console.log("✅ Serviços já prontos!");
      return true;
    }

    // Inicializar Firebase
    console.log("🔧 Inicializando Firebase app...");
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase app inicializado com sucesso!");

    // Acessar serviços
    window.db = firebase.firestore();
    window.auth = firebase.auth();
    console.log("✅ Firestore acessado!");
    console.log("✅ Auth acessado!");

    // Configurar persistência
    window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(() => {
        console.log("✅ Persistência LOCAL configurada!");
      })
      .catch((err) => {
        console.warn("⚠️ LOCAL persistence falhou, tentando SESSION:", err.code);
        return window.auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
      })
      .then(() => {
        console.log("✅ Persistência SESSION configurada!");
      })
      .catch((err) => {
        console.warn("⚠️ SESSION persistence também falhou:", err.code);
      });

    console.log("🚀 FIREBASE INICIALIZADO COM SUCESSO!");
    return true;

  } catch (error) {
    console.error("❌ ERRO ao inicializar Firebase:", error.message);
    console.error("Detalhes:", error);
    return false;
  }
}

// Tentar inicializar imediatamente
console.log("⏳ Tentativa 1: Inicializar imediatamente...");
if (!tryInitialize()) {
  // Se não funcionou, esperar um pouco e tentar novamente
  console.log("⏳ Tentativa 2: Aguardando 500ms...");
  setTimeout(() => {
    if (!tryInitialize()) {
      console.log("⏳ Tentativa 3: Aguardando 1000ms...");
      setTimeout(() => {
        if (!tryInitialize()) {
          console.log("⏳ Tentativa 4: Aguardando 2000ms...");
          setTimeout(() => {
            if (!tryInitialize()) {
              console.error("❌ FALHA CRÍTICA: Firebase não conseguiu inicializar após 4 tentativas!");
              console.error("Por favor, verifique:");
              console.error("1. Os scripts do Firebase estão carregando no HTML?");
              console.error("2. A ordem dos scripts está correta?");
              console.error("3. Há erro de rede nos DevTools?");
              console.log("\nWindow.firebase existe?", typeof window.firebase);
              console.log("Window.auth existe?", typeof window.auth);
              console.log("Window.db existe?", typeof window.db);
            }
          }, 2000);
        }
      }, 1000);
    }
  }, 500);
}

// Expor globalmente para debug
window.firebaseConfig = firebaseConfig;
window.firebaseDebug = {
  checkStatus: () => {
    console.log("=== FIREBASE STATUS ===");
    console.log("firebase disponível?", typeof firebase !== 'undefined');
    console.log("window.db disponível?", typeof window.db !== 'undefined');
    console.log("window.auth disponível?", typeof window.auth !== 'undefined');
    if (typeof firebase !== 'undefined' && firebase.apps) {
      console.log("Firebase apps count:", firebase.apps.length);
      console.log("Firebase apps:", firebase.apps.map(app => app.name));
    }
  }
};

console.log("📝 Digite 'window.firebaseDebug.checkStatus()' no console para verificar status!");
