const SESSION_KEY = 'trazabilidad_auth'

export const saveSession = (authData) => {
  const sessionData = {
    ...authData,
    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData))
}

export const getSession = () => {
  const sessionStr = localStorage.getItem(SESSION_KEY)
  if (!sessionStr) return null
  
  const sessionData = JSON.parse(sessionStr)
  if (Date.now() > sessionData.expires) {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
  
  return sessionData
}

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY)
}