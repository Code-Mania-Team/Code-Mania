// utils/session.js
import axios from 'axios';

// Parse token from window.location.hash like #access_token=...&...
function parseHashToken(hash) {
  if (!hash) return null;
  const h = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(h);
  console.log('Parsed hash params:', Object.fromEntries(params.entries()));
  return params.get('access_token') || params.get('token') || params.get('accessToken');

}


async function handleMagicLink(token) {
  
  const t =  parseHashToken(window.location.hash);
  if (!t) return null;

  try {
    const res = await axios.post(
      'http://localhost:3000/v1/verify',
      { token: t },
      {
        headers: {
          apikey: 'hotdog',
          'Content-Type': 'application/json',
        },
      }
    );

    const body = res?.data;
    if (!body) return null;

    // backend returns a JWT token (token) on success
    if (body.token) {
      localStorage.setItem('apiToken', body.token);
      console.log('apitoken', localStorage.getItem('apiToken'))
      localStorage.setItem('isAuthenticated', 'true');
      console.log('isAuthenticated', localStorage.getItem('isAuthenticated'))
      if (body.username) localStorage.setItem('username', body.username);
    }

    // Clean the URL so tokens aren't exposed in the address bar
    try {
      if (typeof window !== 'undefined' && window.history && window.location.hash) {
        const { pathname, search } = window.location;
        window.history.replaceState({}, document.title, pathname + search);
      }
    } catch (e) {
      // ignore
    }

    return body;
  } catch (err) {
    console.error('verifyWithBackend error', err?.response?.data || err.message || err);
    return null;
  }
}

// Sign out: call backend signout endpoint and then clear client state. Also
// attempt to sign out the Supabase client if available.
export async function signOut() {
  const apiToken = localStorage.getItem('apiToken');
  console.log('signout apitoken', apiToken);

  try {
    axios.post(
      'http://localhost:3000/v1/signout',
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          token: apiToken
        },
      }
    ).catch(() => {
      console.warn('backend signout failed');
    });

    localStorage.removeItem('apiToken');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');

    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  } catch (err) {
    console.error('signOut error', err);
  }
}

export default handleMagicLink;