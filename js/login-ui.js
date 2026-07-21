(() => {
  const email = document.getElementById('loginEmail');
  const password = document.getElementById('loginPassword');
  const remember = document.getElementById('rememberLoginAccess');
  const toggle = document.getElementById('toggleLoginPassword');

  try {
    const savedEmail = localStorage.getItem('77team.rememberedEmail');
    if (savedEmail && email) {
      email.value = savedEmail;
      if (remember) remember.checked = true;
    }
  } catch (_) {}

  toggle?.addEventListener('click', () => {
    if (!password) return;
    const showing = password.type === 'text';
    password.type = showing ? 'password' : 'text';
    toggle.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
    toggle.textContent = showing ? '◉' : '◌';
  });

  document.getElementById('loginForm')?.addEventListener('submit', () => {
    try {
      if (remember?.checked && email?.value) localStorage.setItem('77team.rememberedEmail', email.value.trim());
      else localStorage.removeItem('77team.rememberedEmail');
    } catch (_) {}
  });
})();
