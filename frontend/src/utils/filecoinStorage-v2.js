import * as Client from '@storacha/client'

// Variables globales para el estado del cliente
let storachaClient = null
let currentSpace = null
let isInitialized = false

/**
 * 🔧 Inicializar cliente Storacha con UCANs
 * Siguiendo las mejores prácticas de la documentación oficial
 */
async function initStorachaClient() {
  try {
    if (storachaClient && isInitialized) {
      console.log('✅ Cliente ya inicializado')
      return storachaClient
    }

    console.log('🚀 Inicializando cliente Storacha con sistema UCAN...')

    // 1. Crear cliente con Agent (genera DID local automáticamente)
    storachaClient = await Client.create()
    console.log('✅ Cliente creado con Agent DID:', storachaClient.agent.did())

    isInitialized = true
    return storachaClient
  } catch (error) {
    console.error('❌ Error inicializando cliente:', error)
    throw new Error(`Falló inicialización del cliente: ${error.message}`)
  }
}

/**
 * 🏠 Configurar espacio siguiendo el flujo UCAN correcto
 */
async function setupSpace() {
  try {
    if (!storachaClient) {
      await initStorachaClient()
    }

    console.log('📦 Configurando espacio para uploads...')

    const email = import.meta.env.VITE_STORACHA_EMAIL
    const spaceDID = import.meta.env.VITE_STORACHA_SPACE_DID

    // Verificar si ya tenemos espacio actual
    let space = storachaClient.currentSpace()
    if (space) {
      console.log('✅ Ya existe espacio actual:', space.did())
      currentSpace = space
      return space
    }

    // Opción 1: Usar espacio específico si está configurado
    if (spaceDID && spaceDID !== 'your_space_did_here') {
      console.log('🔑 Intentando usar espacio específico:', spaceDID.substring(0, 20) + '...')
      try {
        await storachaClient.setCurrentSpace(spaceDID)
        space = storachaClient.currentSpace()
        if (space) {
          console.log('✅ Espacio específico configurado exitosamente')
          currentSpace = space
          return space
        }
      } catch (spaceError) {
        console.warn('⚠️  Espacio específico no accesible:', spaceError.message)
        // Continuar con otras opciones
      }
    }

    // Opción 2: Login con email y crear/acceder espacio con cuenta
    if (email && email !== 'tu_email_aqui') {
      console.log('📧 Autenticando con email:', email)
      try {
        const account = await storachaClient.login(email)
        console.log('✅ Login exitoso')

        // Verificar plan de pago (necesario para espacios persistentes)
        console.log('💳 Verificando plan de pago...')
        await account.plan.wait()
        console.log('✅ Plan de pago válido')

        // Crear espacio con cuenta
        space = await storachaClient.createSpace('ProductTracer-Space', { account })
        console.log('✅ Espacio creado con cuenta:', space.did())
        
        // Guardar DID para futuro uso
        console.log('💾 Para usar este espacio en el futuro, agrega a tu .env:')
        console.log(`VITE_STORACHA_SPACE_DID=${space.did()}`)
        
        currentSpace = space
        return space
      } catch (emailError) {
        console.warn('⚠️  Error con autenticación por email:', emailError.message)
        
        if (emailError.message.includes('confirmation') || emailError.message.includes('verify')) {
          throw new Error('📧 Tu email necesita confirmación. Revisa tu bandeja de entrada y confirma el enlace de Storacha.')
        }
        
        if (emailError.message.includes('plan') || emailError.message.includes('payment')) {
          throw new Error('💳 Necesitas configurar un plan de pago en Storacha. Visita https://console.storacha.network')
        }
        
        console.log('Creando espacio local como respaldo...')
      }
    }

    // Opción 3: Crear espacio local (sin recovery entre dispositivos)
    console.log('🏠 Creando espacio local temporal...')
    space = await storachaClient.createSpace('ProductTracer-Local')
    console.log('✅ Espacio local creado:', space.did())
    console.log('⚠️  NOTA: Este espacio es local y no se puede recuperar en otros dispositivos')
    
    currentSpace = space
    return space
  } catch (error) {
    console.error('❌ Error configurando espacio:', error)
    throw error
  }
}

/**
 * 📤 Subir archivo individual
 */
export async function uploadFileToStoracha(file) {
  try {
    console.log('📤 Iniciando subida de archivo:', file.name)

    // Asegurar cliente y espacio están configurados
    await setupSpace()
    
    if (!currentSpace) {
      throw new Error('No se pudo configurar espacio para subida')
    }

    console.log('📁 Subiendo archivo al espacio:', currentSpace.did().substring(0, 20) + '...')
    
    // Subir archivo usando la API correcta
    const cid = await storachaClient.uploadFile(file)
    
    console.log('✅ Archivo subido exitosamente!')
    console.log('🔗 CID:', cid.toString())
    console.log('🌐 Gateway URL:', `https://${cid}.ipfs.w3s.link`)
    
    return {
      success: true,
      cid: cid.toString(),
      gatewayUrl: `https://${cid}.ipfs.w3s.link`,
      spaceDID: currentSpace.did()
    }
  } catch (error) {
    console.error('❌ Error subiendo archivo:', error)
    
    // Mensajes de error más específicos
    if (error.message.includes('space/blob/add')) {
      throw new Error('❌ Sin permisos para subir al espacio. Verifica tu configuración de email y plan de pago.')
    }
    
    if (error.message.includes('plan') || error.message.includes('payment')) {
      throw new Error('💳 Se requiere plan de pago activo. Configura uno en https://console.storacha.network')
    }
    
    if (error.message.includes('email') || error.message.includes('confirmation')) {
      throw new Error('📧 Email no confirmado. Revisa tu bandeja de entrada.')
    }
    
    throw new Error(`Error de subida: ${error.message}`)
  }
}

/**
 * 📤 Subir múltiples archivos como directorio
 */
export async function uploadDirectoryToStoracha(files) {
  try {
    console.log('📁 Iniciando subida de directorio con', files.length, 'archivos')

    // Asegurar cliente y espacio están configurados
    await setupSpace()
    
    if (!currentSpace) {
      throw new Error('No se pudo configurar espacio para subida')
    }

    console.log('📁 Subiendo directorio al espacio:', currentSpace.did().substring(0, 20) + '...')
    
    // Subir directorio usando la API correcta
    const cid = await storachaClient.uploadDirectory(files)
    
    console.log('✅ Directorio subido exitosamente!')
    console.log('🔗 CID:', cid.toString())
    console.log('🌐 Gateway URL:', `https://${cid}.ipfs.w3s.link`)
    
    return {
      success: true,
      cid: cid.toString(),
      gatewayUrl: `https://${cid}.ipfs.w3s.link`,
      spaceDID: currentSpace.did()
    }
  } catch (error) {
    console.error('❌ Error subiendo directorio:', error)
    throw new Error(`Error de subida de directorio: ${error.message}`)
  }
}

/**
 * ℹ️  Obtener información del estado actual
 */
export async function getStorachaStatus() {
  try {
    if (!storachaClient) {
      await initStorachaClient()
    }
    
    const space = storachaClient.currentSpace()
    const email = import.meta.env.VITE_STORACHA_EMAIL
    const spaceDID = import.meta.env.VITE_STORACHA_SPACE_DID
    
    return {
      clientInitialized: !!storachaClient,
      agentDID: storachaClient?.agent.did(),
      hasSpace: !!space,
      currentSpaceDID: space?.did(),
      configuredEmail: email || null,
      configuredSpaceDID: spaceDID || null,
      isAuthenticated: !!(space && email)
    }
  } catch (error) {
    console.error('❌ Error obteniendo estado:', error)
    return {
      clientInitialized: false,
      error: error.message
    }
  }
}

/**
 * 🔄 Reinicializar todo (para debugging)
 */
export async function resetStoracha() {
  try {
    console.log('🔄 Reiniciando Storacha...')
    
    storachaClient = null
    currentSpace = null
    isInitialized = false
    
    await initStorachaClient()
    await setupSpace()
    
    console.log('✅ Storacha reiniciado exitosamente')
    return await getStorachaStatus()
  } catch (error) {
    console.error('❌ Error reiniciando:', error)
    throw error
  }
}

// Función principal para mantener compatibilidad con código existente
export async function uploadToFilecoin(file) {
  return await uploadFileToStoracha(file)
}
