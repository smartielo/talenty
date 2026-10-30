const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isAuthConfigured = Object.values(firebaseConfig).every(Boolean);
let clientPromise;

export async function getAuthClient() {
  if (!isAuthConfigured) throw new Error('auth/not-configured');
  if (!clientPromise) {
    clientPromise = Promise.all([import('firebase/app'), import('firebase/auth')]).then(([app, sdk]) => {
      const instance = app.getApps().length ? app.getApp() : app.initializeApp(firebaseConfig);
      const auth = sdk.getAuth(instance);
      auth.languageCode = 'pt-BR';
      return { auth, sdk };
    }).catch((error) => { clientPromise = undefined; throw error; });
  }
  return clientPromise;
}

export async function login(email, password, remember) {
  const { auth, sdk } = await getAuthClient();
  await sdk.setPersistence(auth, remember ? sdk.browserLocalPersistence : sdk.browserSessionPersistence);
  return sdk.signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function register(name, email, password) {
  const { auth, sdk } = await getAuthClient();
  await sdk.setPersistence(auth, sdk.browserLocalPersistence);
  const credential = await sdk.createUserWithEmailAndPassword(auth, email.trim(), password);
  // Somente identidade no Authentication. O perfil de prestador será criado pela API.
  try {
    await sdk.updateProfile(credential.user, { displayName: name.trim() });
  } catch {
    // A conta já existe: não repetir o cadastro por uma falha ao salvar o nome.
    return { ...credential, profilePending: true };
  }
  return credential;
}

export async function resetPassword(email) {
  const { auth, sdk } = await getAuthClient();
  await sdk.sendPasswordResetEmail(auth, email.trim());
}

export async function logout() {
  if (!isAuthConfigured) return;
  const { auth, sdk } = await getAuthClient();
  await sdk.signOut(auth);
}

export function authErrorMessage(error) {
  const code = error.code || error.message;
  const messages = {
    'auth/not-configured': 'O acesso por conta ainda não está disponível. Você pode explorar o feed de demonstração sem fazer login.',
    'auth/invalid-email': 'Confira se o e-mail foi digitado corretamente.',
    'auth/invalid-credential': 'E-mail ou senha incorretos. Confira os dados e tente novamente.',
    'auth/user-not-found': 'E-mail ou senha incorretos. Confira os dados e tente novamente.',
    'auth/wrong-password': 'E-mail ou senha incorretos. Confira os dados e tente novamente.',
    'auth/email-already-in-use': 'Este e-mail já tem uma conta. Entre ou recupere sua senha.',
    'auth/weak-password': 'Escolha uma senha mais forte, com pelo menos 8 caracteres.',
    'auth/password-does-not-meet-requirements': 'A senha não atende aos requisitos de segurança. Inclua letras maiúsculas e minúsculas, números e símbolos.',
    'auth/too-many-requests': 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.',
    'auth/network-request-failed': 'Não foi possível conectar. Confira sua internet e tente novamente.',
    'auth/user-disabled': 'Esta conta está desativada. Entre em contato com a equipe do projeto.',
    'auth/operation-not-allowed': 'O acesso por e-mail ainda não foi habilitado. Tente novamente mais tarde.',
  };
  return messages[code] || 'Não foi possível concluir agora. Tente novamente mais tarde.';
}
