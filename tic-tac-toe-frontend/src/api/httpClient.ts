import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// in src/api/httpClient.ts
httpClient.interceptors.request.use(config => {
  const playerId = localStorage.getItem('playerId');
  if (playerId) {
    // WICHTIG: Schreibweise wie im Bash-Script Zeile 44
    config.headers['X-Player-Id'] = playerId; 
  }
  return config;
});

// RESPONSE INTERCEPTOR
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Optional: Logging für Debugging
    if (error.response) {
       console.error('API Error:', error.response.status, error.response.data);
    }
    return Promise.reject(error);
  }
);

export default httpClient;