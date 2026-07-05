const statusEl = document.getElementById('auth-status');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const refreshButton = document.getElementById('refresh-button');
const noTokenButton = document.getElementById('no-token-button');
const moviesListEl = document.getElementById('movies-list');
const messageBox = document.getElementById('message-box');
const createForm = document.getElementById('create-form');
const updateForm = document.getElementById('update-form');
const deleteForm = document.getElementById('delete-form');
const rentForm = document.getElementById('rent-form');
const returnForm = document.getElementById('return-form');
const roleBadge = document.getElementById('role-badge');
const tokenPreviewEl = document.getElementById('token-preview');
const userInfoEl = document.getElementById('user-info');
const adminSection = document.getElementById('admin-section');

let token = null;
let userProfile = null;

function setMessage(message) {
  messageBox.textContent = message;
}

function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
}

function parseJwt(tokenValue) {
  try {
    const payload = tokenValue.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

function setAuthState(newToken) {
  token = newToken;
  userProfile = token ? parseJwt(token) : null;

  if (token && userProfile) {
    localStorage.setItem('sakila_jwt', token);
    statusEl.textContent = `Autenticado como ${userProfile.name || userProfile.email || 'usuario'}.`;
    roleBadge.textContent = `Rol: ${userProfile.role || 'Customer'}`;
    tokenPreviewEl.textContent = `${token.slice(0, 20)}...${token.slice(-10)}`;
    userInfoEl.innerHTML = `<strong>${userProfile.name || userProfile.email}</strong><br>${userProfile.email || ''}`;
    logoutButton.disabled = false;
    loginButton.disabled = true;
    loginButton.textContent = 'Conectado';
    adminSection.hidden = userProfile.role !== 'Admin';
  } else {
    localStorage.removeItem('sakila_jwt');
    statusEl.textContent = 'No autenticado.';
    roleBadge.textContent = 'Rol: Invitado';
    tokenPreviewEl.textContent = 'Sin token';
    userInfoEl.textContent = 'Inicia sesión para ver tu usuario y rol.';
    logoutButton.disabled = true;
    loginButton.disabled = false;
    loginButton.textContent = 'Iniciar sesión con Google';
    adminSection.hidden = true;
  }
}

function getAuthHeaders() {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchProfile() {
  if (!token) return;
  try {
    const response = await fetch('/auth/me', { headers: getAuthHeaders() });
    if (!response.ok) {
      throw new Error('No se pudo cargar el perfil');
    }
    const profile = await response.json();
    userProfile = profile;
    setAuthState(token);
    setMessage(`Perfil cargado: ${profile.role}`);
  } catch (error) {
    setMessage(error.message);
  }
}

async function fetchMovies() {
  if (!token) {
    moviesListEl.innerHTML = '<p>Acceso no autorizado sin token.</p>';
    setMessage('Acceso rechazado sin token. Inicia sesión para ver películas.');
    return;
  }

  try {
    const response = await fetch('/movies', { headers: getAuthHeaders() });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Acceso rechazado: ${response.status} ${text}`);
    }
    const movies = await response.json();
    renderMovies(movies);
    setMessage('Películas cargadas.');
  } catch (error) {
    moviesListEl.innerHTML = '<p>Acceso no autorizado sin token.</p>';
    setMessage(error.message);
  }
}

function renderMovies(movies) {
  if (!Array.isArray(movies) || movies.length === 0) {
    moviesListEl.innerHTML = '<p>No hay películas activas.</p>';
    return;
  }
  const rows = movies.map(movie => `
    <tr>
      <td>${movie.id}</td>
      <td>${movie.title}</td>
      <td>${movie.description || ''}</td>
      <td>${movie.release_year || ''}</td>
      <td>${movie.rental_rate || ''}</td>
      <td>${movie.length || ''}</td>
      <td>${movie.available === 0 ? 'Prestada' : 'Disponible'}</td>
    </tr>
  `).join('');
  moviesListEl.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Título</th>
          <th>Descripción</th>
          <th>Año</th>
          <th>Tarifa</th>
          <th>Duración</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

loginButton.addEventListener('click', () => {
  window.location.href = '/auth/google';
});

logoutButton.addEventListener('click', async () => {
  try {
    if (!token) return;
    const response = await fetch('/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Error ${response.status}`);
    }
    setAuthState(null);
    setMessage('Sesión cerrada correctamente.');
  } catch (err) {
    setMessage(err.message);
  }
});

noTokenButton.addEventListener('click', async () => {
  try {
    const response = await fetch('/movies');
    const text = await response.text();
    if (!response.ok) {
      moviesListEl.innerHTML = '<p>Acceso no autorizado sin token.</p>';
      setMessage(`Acceso rechazado sin token: ${response.status} ${text}`);
      return;
    }
    setMessage('Acceso permitido sin token.');
  } catch (err) {
    moviesListEl.innerHTML = '<p>Acceso no autorizado sin token.</p>';
    setMessage(err.message);
  }
});

refreshButton.addEventListener('click', fetchMovies);

createForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(createForm));
  try {
    const response = await fetch('/movies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Error ${response.status}`);
    }
    const result = await response.json();
    setMessage(`Película creada con id ${result.id}`);
    fetchMovies();
    createForm.reset();
  } catch (err) {
    setMessage(err.message);
  }
});

updateForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(updateForm));
  const id = data.id;
  delete data.id;
  try {
    const response = await fetch(`/movies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Error ${response.status}`);
    }
    setMessage(`Película ${id} actualizada.`);
    fetchMovies();
    updateForm.reset();
  } catch (err) {
    setMessage(err.message);
  }
});

deleteForm.addEventListener('submit', async event => {
  event.preventDefault();
  const id = new FormData(deleteForm).get('id');
  try {
    const response = await fetch(`/movies/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Error ${response.status}`);
    }
    setMessage(`Película ${id} desactivada.`);
    fetchMovies();
    deleteForm.reset();
  } catch (err) {
    setMessage(err.message);
  }
});

rentForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(rentForm));
  const id = data.id;
  try {
    const response = await fetch(`/movies/${id}/rent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Error ${response.status}`);
    }
    setMessage(`Alquiler de película ${id} registrado.`);
    fetchMovies();
    rentForm.reset();
  } catch (err) {
    setMessage(err.message);
  }
});

returnForm.addEventListener('submit', async event => {
  event.preventDefault();
  const id = new FormData(returnForm).get('id');
  try {
    const response = await fetch(`/movies/${id}/return`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Error ${response.status}`);
    }
    setMessage(`Película ${id} devuelta.`);
    fetchMovies();
    returnForm.reset();
  } catch (err) {
    setMessage(err.message);
  }
});

function init() {
  const urlToken = getTokenFromUrl();
  const savedToken = localStorage.getItem('sakila_jwt');
  const newToken = urlToken || savedToken;
  if (urlToken) {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
  }
  setAuthState(newToken);
  if (newToken) {
    fetchProfile().finally(() => fetchMovies());
  } else {
    moviesListEl.innerHTML = '<p>Acceso no autorizado sin token.</p>';
    setMessage('Inicia sesión para ver películas y realizar alquileres.');
  }
}

init();
