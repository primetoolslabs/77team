export function authError(error){
  const map={
    "auth/invalid-credential":"E-mail ou senha incorretos.",
    "auth/email-already-in-use":"Este e-mail já está cadastrado.",
    "auth/weak-password":"Use uma senha com pelo menos 6 caracteres.",
    "auth/invalid-email":"E-mail inválido.",
    "permission-denied":"Permissão negada pelo Firestore."
  };
  return map[error?.code]||`${error?.code||"erro"}: ${error?.message||"Falha inesperada"}`;
}
