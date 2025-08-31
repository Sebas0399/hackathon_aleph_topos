import React, { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import { verifyMessage } from 'ethers'
import { saveSession, clearSession } from '../utils/sessionManager'

const WalletLogin = ({ onLogin = () => {} }) => {
  const { connect, connectors, error, isLoading } = useConnect()
  const { disconnect } = useDisconnect()
  const { isConnected, address } = useAccount()
  const [message, setMessage] = useState('')
  const {
    signMessage,
    data: signature,
    isSuccess,
    isError,
    error: signError,
    isLoading: isSigning,
    reset
  } = useSignMessage()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [infoMsg, setInfoMsg] = useState('')

  const handleLogin = async () => {
    if (!isConnected) {
      setInfoMsg('Conectando wallet...')
      connect({ connector: connectors[0] })
      return
    }

    const msg = `Autenticación para TrazabilidadApp - Fecha: ${new Date().toISOString()}`
    setMessage(msg)
    setInfoMsg('Solicitando firma de mensaje...')
    signMessage({ message: msg })
  }

  // Efecto para manejar el resultado de la firma
  useEffect(() => {
    if (isSuccess && signature && message) {
      setInfoMsg('Mensaje firmado. Verificando...')
      const verified = verifyMessage(message, signature) === address
      setInfoMsg(verified ? 'Firma verificada. Guardando sesión...' : 'La firma no coincide con la dirección. Sesión no guardada.')
      if (verified) {
        setIsAuthenticated(true)
        const userData = {
          address,
          signature,
          authenticatedAt: new Date().toISOString()
        }
        saveSession(userData)
        setInfoMsg('Sesión guardada correctamente')
        // Verificar que onLogin existe antes de llamarla
        if (typeof onLogin === 'function') {
          onLogin(userData)
        }
      }
      reset()
    }
    if (isError && signError) {
      setInfoMsg('Error al firmar el mensaje: ' + signError.message)
      reset()
    }
  }, [isSuccess, isError, signature, signError, message, address, onLogin, reset])

  const handleDisconnect = () => {
  setInfoMsg('Desconectando wallet y limpiando sesión...')
  disconnect()
  setIsAuthenticated(false)
  clearSession()
  setInfoMsg('Sesión eliminada')
  onLogin(null)
  }

  return (
    <div className="wallet-login">
      {infoMsg && <div className="info-msg">{infoMsg}</div>}
      {!isConnected ? (
        <button onClick={handleLogin} className="login-button" disabled={isLoading}>
          {isLoading ? 'Conectando...' : 'Conectar Wallet'}
        </button>
      ) : !isAuthenticated ? (
        <button onClick={handleLogin} className="sign-button" disabled={isSigning}>
          {isSigning ? 'Firmando...' : 'Firmar Mensaje para Autenticar'}
        </button>
      ) : (
        <div className="wallet-info">
          <span>Conectado: {address?.substring(0, 8)}...</span>
          <button onClick={handleDisconnect} className="disconnect-button">
            Desconectar
          </button>
        </div>
      )}
      {error && <div className="error">{error.message}</div>}
    </div>
  )
}

export default WalletLogin