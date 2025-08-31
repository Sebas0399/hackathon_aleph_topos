import React from 'react'
import WalletLogin from './WalletLogin'

const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    return (
      <div className="protected-route">
        <h2>Autenticación Requerida</h2>
        <p>Por favor conecta tu wallet para acceder a esta funcionalidad</p>
        <WalletLogin />
      </div>
    )
  }

  return children
}

export default ProtectedRoute