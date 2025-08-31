// 📋 Storacha Client - Implementación basada en documentación oficial
// https://docs.storacha.network/how-to/upload/

import { create } from '@storacha/client'

// Estado global del cliente
let client = null
let initializationPromise = null
let loginPromise = null
// Evita reintentos automáticos infinitos cuando el login tarda o no se confirma
let loginAttempted = false
// Guard para una sola subida activa a la vez
let activeUpload = null
const UPLOAD_TIMEOUT_MS = 2 * 60 * 1000 // 2 minutos

/**
 * ✅ Inicializar cliente Storacha según la documentación oficial
 */
const initializeStorachaClient = async () => {
  // Si ya hay un cliente listo, devolverlo
  if (client) {
    return client
  }

  // Si ya hay una inicialización en curso, esperar a que termine
  if (initializationPromise) {
    return await initializationPromise
  }

  // Crear nueva promesa de inicialización (solo una vez)
  initializationPromise = initializeClient()
  return await initializationPromise
}

/**
 * 🔧 Función interna de inicialización
 */
const initializeClient = async () => {
  try {
    console.log('🚀 Inicializando Storacha Client...')
    
    // Crear cliente (usa store persistente por defecto)
    client = await create()
    console.log('✅ Cliente Storacha creado')

    // Configurar espacio según email disponible
    await setupStorachaSpace(client)
    
    return client
    
  } catch (error) {
    console.error('❌ Error inicializando Storacha:', error)
    // Limpiar estado en caso de error
    client = null
    initializationPromise = null
    loginPromise = null
    throw new Error(`Falló inicialización: ${error.message}`)
  }
}

/**
 * ⚙️ Configurar espacio usando email o local según disponibilidad
 */
const setupStorachaSpace = async (client) => {
  const email = import.meta.env.VITE_STORACHA_EMAIL
  const spaceDID = import.meta.env.VITE_STORACHA_SPACE_DID

  console.log('📧 Email config:', email || 'no configurado')
  console.log('🏠 Space DID config:', spaceDID ? `${spaceDID.slice(0, 20)}...` : 'no configurado')

  // Opción 1: Usar espacio configurado si existe
  if (spaceDID && spaceDID !== 'your_space_did_here') {
    try {
      console.log('🎯 Intentando usar espacio configurado...')
      await client.setCurrentSpace(spaceDID)
      
      const currentSpace = client.currentSpace()
      if (currentSpace && currentSpace.did() === spaceDID) {
        console.log('✅ Espacio configurado establecido')
        return currentSpace
      }
    } catch (error) {
      console.warn('⚠️ No se pudo usar espacio configurado:', error.message)
    }
  }

  // Opción 2: Autenticación con email (intento único automático)
  // Si el login o la confirmación del plan tarda demasiado, hacemos fallback a espacio local
  const LOGIN_TIMEOUT_MS = 15000 // 15s
  const PLAN_TIMEOUT_MS = 15000 // 15s

  if (email && email !== 'tu_email_aqui' && !loginAttempted) {
    loginAttempted = true
    try {
      console.log('📨 Intentando login con email:', email)

      // Evitar múltiples logins simultáneos del mismo email
      if (!loginPromise) {
        loginPromise = client.login(email)
      }

      // Esperamos el login pero con timeout para no dejar la app colgada
      const loginResult = await Promise.race([
        loginPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('login_timeout')), LOGIN_TIMEOUT_MS))
      ])

      const account = loginResult
      console.log('✅ Login exitoso')

      // Esperar confirmación del plan de pago con timeout
      console.log('⏳ Esperando confirmación del plan...')
      await Promise.race([
        account.plan.wait(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('plan_timeout')), PLAN_TIMEOUT_MS))
      ])
      console.log('✅ Plan confirmado')

      // Crear espacio con recovery
      const space = await client.createSpace('storacha-space', { account })
      console.log('✅ Espacio creado con recovery:', space.did())

      // Establecer como actual
      await client.setCurrentSpace(space.did())

      console.log('💡 Guarda este DID para futuras sesiones:')
      console.log(`VITE_STORACHA_SPACE_DID=${space.did()}`)

      return space

    } catch (emailError) {
      console.warn('⚠️ Error con autenticación por email:', emailError.message)
      // Limpiar loginPromise en caso de error o timeout para permitir reintentos manuales
      loginPromise = null

      if (emailError.message.includes('login_timeout') || emailError.message.includes('plan_timeout')) {
        console.warn('⏳ Timeout en login/plan — se usará espacio local como fallback')
      } else if (emailError.message.includes('confirmation')) {
        console.log('📬 Revisa tu email para confirmar la cuenta')
      } else if (emailError.message.includes('plan')) {
        console.log('💳 Configura tu plan de pago en Storacha')
      }

      console.log('🔄 Continuando con espacio local...')
    }
  }

  // Opción 3: Espacio local (sin recovery)
  console.log('🏠 Creando espacio local...')
  const space = await client.createSpace('local-space')
  console.log('✅ Espacio local creado:', space.did())
  console.log('⚠️ Sin recovery - solo para esta sesión')
  
  await client.setCurrentSpace(space.did())
  return space
}

/**
 * Crear un espacio local y establecerlo como current (fallback)
 */
const ensureLocalSpace = async (client) => {
  try {
    console.log('🏠 Intentando crear espacio local (fallback)')
    const space = await client.createSpace('local-space-fallback')
    await client.setCurrentSpace(space.did())
    console.log('✅ Espacio local fallback creado:', space.did())
    return space
  } catch (err) {
    console.warn('⚠️ No se pudo crear espacio local fallback:', err.message)
    throw err
  }
}

export { ensureLocalSpace }

/**
 * 📁 Subir archivo único
 * Ref: https://docs.storacha.network/how-to/upload/#preparing-files-and-uploading
 */
export const uploadSingleFile = async (file) => {
  try {
    console.log('📤 Subiendo archivo:', file.name)
    
    // Si ya hay una subida en curso, reutilizarla (evita múltiples peticiones por clicks duplicados)
    if (activeUpload) {
      console.log('🔁 Esperando upload activo existente...')
      return await activeUpload
    }

    const client = await initializeStorachaClient()

    // Lanzar la subida y aplicar timeout
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
    const uploadPromise = (async () => {
      try {
        // Intentar pasar signal si el cliente lo soporta
        if (controller) {
          try {
            const cid = await client.uploadFile(file, { signal: controller.signal })
            return cid.toString()
          } catch (err) {
            // Si el cliente no soporta signal, intentar sin opciones
            console.warn('⚠️ client.uploadFile no aceptó signal, reintentando sin signal:', err.message)
            const cid = await client.uploadFile(file)
            return cid.toString()
          }
        } else {
          const cid = await client.uploadFile(file)
          return cid.toString()
        }
      } catch (err) {
        throw err
      }
    })()

    activeUpload = (async () => {
      try {
        // Esperar la subida con timeout
        const result = await Promise.race([
          uploadPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('upload_timeout')), UPLOAD_TIMEOUT_MS))
        ])
        console.log('✅ Archivo subido con CID:', result)
        return result
      } catch (err) {
        // Si hay error de permisos del espacio, intentar crear espacio local y reintentar una vez
        if (err && err.message && err.message.includes('space/blob/add')) {
          console.warn('❌ Error de permisos space/blob/add detectado, intentando espacio local y reintento...')
          try {
            const space = await ensureLocalSpace(client)

            // Loguear el espacio actual para depuración
            try {
              const current = client.currentSpace()
              console.log('ℹ️ Espacio actual tras fallback:', current && typeof current.did === 'function' ? current.did() : current)
            } catch (logErr) {
              console.warn('⚠️ No se pudo leer currentSpace():', logErr.message)
            }

            // Esperar un pequeño lapso para que el servidor procese la creación del espacio
            await new Promise((r) => setTimeout(r, 500))

            // Primer reintento
            try {
              const cidRetry = await client.uploadFile(file)
              console.log('🔁 Reintento exitoso con CID:', cidRetry.toString())
              return cidRetry.toString()
            } catch (uploadErr) {
              console.warn('⚠️ Reintento 1 falló:', uploadErr.message)

              // Intentar re-asignar el espacio actual y reintentar una vez más
              try {
                await client.setCurrentSpace(space.did())
                // espera breve antes del segundo intento
                await new Promise((r) => setTimeout(r, 300))
                const cidRetry2 = await client.uploadFile(file)
                console.log('🔁 Reintento 2 exitoso con CID:', cidRetry2.toString())
                return cidRetry2.toString()
              } catch (retryErr2) {
                console.error('❌ Reintento 2 falló:', retryErr2.message)
                throw retryErr2
              }
            }
          } catch (retryErr) {
            console.error('❌ Reintento falló:', retryErr.message)
            throw retryErr
          }
        }
        // En timeout o error, abortar la petición nativa si es posible
        if (err && err.message && err.message.includes('upload_timeout')) {
          console.warn('⏳ Upload timeout alcanzado, abortando fetch subyacente si es soportado')
          try {
            controller?.abort()
          } catch (abortErr) {
            console.warn('⚠️ Abort no soportado o fallo al abortar:', abortErr.message)
          }
        }
        throw err
      } finally {
        // Limpiar el guard cuando termine o falle
        activeUpload = null
      }
    })()

    return await activeUpload
    
  } catch (error) {
    console.error('❌ Error subiendo archivo:', error)
    throw new Error(`Fallo en subida: ${error.message}`)
  }
}

/**
 * 📁 Subir múltiples archivos
 */
export const uploadMultipleFiles = async (files) => {
  try {
    console.log('📤 Subiendo directorio con', files.length, 'archivos')
    
    const client = await initializeStorachaClient()
    const cid = await client.uploadDirectory(files)
    
    console.log('✅ Directorio subido con CID:', cid.toString())
    return cid.toString()
    
  } catch (error) {
    console.error('❌ Error subiendo directorio:', error)
    throw new Error(`Fallo en subida: ${error.message}`)
  }
}

/**
 * 🔄 Legacy function para compatibilidad
 */
export const storeFile = async (file) => {
  return await uploadSingleFile(file)
}

/**
 * Recurso para debug: indica si hay una subida activa
 */
export const getActiveUploadCount = () => {
  return activeUpload ? 1 : 0
}

/**
 * ℹ️ Obtener información del cliente
 */
export const getClientInfo = async () => {
  try {
    const client = await initializeStorachaClient()
    const space = client.currentSpace()
    
    return {
      isReady: !!client,
      hasSpace: !!space,
      spaceDID: space?.did(),
      agentDID: client.agent?.did()
    }
  } catch (error) {
    return {
      isReady: false,
      hasSpace: false,
      error: error.message
    }
  }
}

/**
 * 🧹 Limpiar estado para testing
 */
export const resetClient = () => {
  client = null
  initializationPromise = null
  loginPromise = null
  console.log('🧹 Cliente reiniciado')
}
