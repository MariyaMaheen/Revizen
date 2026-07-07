const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getToken() {
  return localStorage.getItem('revizen_token')
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handleResponse(res) {
  if (res.status === 401) {
    localStorage.removeItem('revizen_token')
    localStorage.removeItem('revizen_user')
    window.location.reload()
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const data = await res.json()
      detail = data.detail || detail
    } catch {}
    throw new Error(detail)
  }
  return res.json()
}

// Auth
export async function register(username, email, password, full_name) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, full_name }),
  })
  return handleResponse(res)
}

export async function login(username, password) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  return handleResponse(res)
}

export async function getMe() {
  const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
    headers: { ...authHeaders() },
  })
  return handleResponse(res)
}

// Chat (non-streaming)
export async function chatPost(question, history = []) {
  const res = await fetch(`${BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ question, history }),
  })
  return handleResponse(res)
}

// Chat stream URL builder
export function chatStreamUrl(question) {
  const encoded = encodeURIComponent(question)
  return `${BASE_URL}/api/v1/chat/stream?question=${encoded}`
}

// Ingest
export async function ingestFile(file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 70)
        onProgress(pct)
      }
    }

    xhr.onload = () => {
      if (xhr.status === 401) {
        localStorage.removeItem('revizen_token')
        localStorage.removeItem('revizen_user')
        window.location.reload()
        reject(new Error('Unauthorized'))
        return
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        try {
          const data = JSON.parse(xhr.responseText)
          reject(new Error(data.detail || `HTTP ${xhr.status}`))
        } catch {
          reject(new Error(`HTTP ${xhr.status}`))
        }
      }
    }

    xhr.onerror = () => reject(new Error('Network error'))

    xhr.open('POST', `${BASE_URL}/api/v1/ingest`)
    const token = getToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(formData)
  })
}

// Documents
export async function getDocuments() {
  const res = await fetch(`${BASE_URL}/api/v1/documents`, {
    headers: { ...authHeaders() },
  })
  return handleResponse(res)
}

export async function deleteDocument(filename) {
  const res = await fetch(`${BASE_URL}/api/v1/documents/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  return handleResponse(res)
}

// Quiz
export async function generateQuiz(topic, difficulty, count) {
  const res = await fetch(`${BASE_URL}/api/v1/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ topic, difficulty, count }),
  })
  return handleResponse(res)
}

export async function saveQuizScore(topic, score, correct, total) {
  const res = await fetch(`${BASE_URL}/api/v1/quiz/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ topic, score, correct, total }),
  })
  return handleResponse(res)
}

// Summary
export async function generateSummary(topic, style) {
  const res = await fetch(`${BASE_URL}/api/v1/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ topic, style }),
  })
  return handleResponse(res)
}

// Flashcards
export async function generateFlashcards(topic, count) {
  const res = await fetch(`${BASE_URL}/api/v1/flashcards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ topic, count }),
  })
  return handleResponse(res)
}

// Insights
export async function getInsights() {
  const res = await fetch(`${BASE_URL}/api/v1/insights`, {
    headers: { ...authHeaders() },
  })
  return handleResponse(res)
}
