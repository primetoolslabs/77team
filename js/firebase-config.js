export const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "SEU-PROJETO.firebaseapp.com",
  projectId: "SEU-PROJETO",
  storageBucket: "SEU-PROJETO.firebasestorage.app",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};
export const FIREBASE_VERSION = "12.15.0";
export function firebaseConfigured(){
  return firebaseConfig.apiKey !== "COLE_AQUI" &&
    firebaseConfig.projectId && !firebaseConfig.projectId.includes("SEU-PROJETO") &&
    firebaseConfig.appId !== "COLE_AQUI";
}
