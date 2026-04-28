// ferstudy/firebase-config.js
// ✅ Firebase OTIMIZADO PARA VERCEL

const firebaseConfig = {
  apiKey: "AIzaSyCrwApr2CdU59OKwtLZKyHOnksy5DqqW7I",
  authDomain: "ferstudy.firebaseapp.com",
  projectId: "ferstudy",
  storageBucket: "ferstudy.firebasestorage.app",
  messagingSenderId: "815271116137",
  appId: "1:815271116137:web:38bcb7a2661843b0b491f8"
};

console.log("📌 [FIREBASE] Iniciando em ambiente Vercel...");

// Variável global para rastrear inicialização
window.firebaseReady = false;
window.firebaseError = null;

// Função para inicializar
async function initializeFirebaseVercel() {
  return new Promise((resolve) => {
    // Tentar imediatamente
    if (typeof firebase !== 'undefined') {
      console.log("✅ [FIREBASE] Firebase CDN detectado imediatamente");
      doInit();
    } else {
      // Esperar Firebase carregar (máx 10 segundos)
      let attempts = 0;
      const maxAttempts = 100; // 10 segundos (100 * 100ms)
      
      const checkFirebase = setInterval(() => {
        attempts++;
        
        if (typeof firebase !== 'undefined') {
          clearInterval(checkFirebase);
          console.log(`✅ [FIREBASE] Firebase detectado na tentativa ${attempts}`);
          doInit();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkFirebase);
          console.error("❌ [FIREBASE] Timeout: Firebase não carregou em 10 segundos");
          window.firebaseError = "Firebase CDN não carregou";
          window.firebaseReady = false;
          resolve(false);
        }
      }, 100);
    }

    function doInit() {
      try {
        console.log("🔧 [FIREBASE] Inicializando Firebase...");
        
        // Verificar se já foi inicializado
        if (firebase.apps && firebase.apps.length > 0) {
          console.log("ℹ️ [FIREBASE] Firebase já estava inicializado");
          window.db = firebase.firestore();
          window.auth = firebase.auth();
          window.firebaseReady = true;
          resolve(true);
          return;
        }

        // Inicializar
        firebase.initializeApp(firebaseConfig);
        console.log("✅ [FIREBASE] Firebase.initializeApp() executado");

        // Acessar serviços
        window.db = firebase.firestore();
        window.auth = firebase.auth();
        
        console.log("✅ [FIREBASE] Firestore acessado");
        console.log("✅ [FIREBASE] Auth acessado");

        // Configurar persistência (opcional em Vercel)
        try {
          window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {
            console.warn("⚠️ [FIREBASE] LOCAL persistence não funcionou");
          });
        } catch (e) {
          console.warn("⚠️ [FIREBASE] Erro ao configurar persistência:", e.message);
        }

        window.firebaseReady = true;
        console.log("🚀 [FIREBASE] INICIALIZAÇÃO COMPLETA!");
        resolve(true);

      } catch (error) {
        console.error("❌ [FIREBASE] ERRO NA INICIALIZAÇÃO:", error.message);
        window.firebaseError = error.message;
        window.firebaseReady = false;
        resolve(false);
      }
    }
  });
}

// Iniciar quando documento estiver ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log("📄 [FIREBASE] DOM carregado, inicializando...");
    initializeFirebaseVercel();
  });
} else {
  console.log("📄 [FIREBASE] DOM já estava pronto, inicializando...");
  initializeFirebaseVercel();
}

// Expor para debug
window.firebaseDebug = {
  checkStatus: () => {
    console.log("=== FIREBASE STATUS ===");
    console.log("Firebase global:", typeof firebase !== 'undefined' ? "✅" : "❌");
    console.log("window.db:", typeof window.db !== 'undefined' ? "✅" : "❌");
    console.log("window.auth:", typeof window.auth !== 'undefined' ? "✅" : "❌");
    console.log("firebaseReady:", window.firebaseReady ? "✅" : "❌");
    console.log("firebaseError:", window.firebaseError || "Nenhum erro");
    
    if (typeof firebase !== 'undefined' && firebase.apps) {
      console.log("Firebase apps:", firebase.apps.length);
    }
  },
  init: initializeFirebaseVercel
};

console.log("💡 [FIREBASE] Use window.firebaseDebug.checkStatus() para verificar status");
