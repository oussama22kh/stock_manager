import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Emplacements from './pages/Emplacements'
import Products from './pages/Products'
import Confirmation from './pages/Confirmation'

function PrivateRoute({ children }) {
  const { token } = useApp()
  return token ? children : <Navigate to="/" replace />
}

export default function App() {
  const { token } = useApp()

  return (
    <div className="min-h-screen bg-gray-50">
      {token && <Navbar />}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/emplacements" element={<PrivateRoute><Emplacements /></PrivateRoute>} />
          <Route path="/produits" element={<PrivateRoute><Products /></PrivateRoute>} />
          <Route path="/confirmation" element={<PrivateRoute><Confirmation /></PrivateRoute>} />
        </Routes>
      </main>
    </div>
  )
}
