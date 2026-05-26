import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import Login from './Pages/Login.jsx'
import Dashboard from './components/DashboardSection.jsx'
import AuthWrapper from './components/AuthWrapper.jsx'
import AdminPanel from './Pages/AdminPanel.jsx'
import { AppContext } from './contexts/AppContext.jsx'
import { ToastContainer } from 'react-toastify'


const App = () => {

  const location = useLocation()
  const isAuthPage = ['/login', '/', ].includes(location.pathname)

  if (isAuthPage) {
    return (
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/login' element={<Login />} />
      </Routes>
    )
  }

  return (
    <>
    <AppContext>
    <div className="flex items-center justify-center min-h-screen bg-[#0e0e0e]">
      <Routes>
        <Route path="/admin-panel" element={
          <AuthWrapper>
            <AdminPanel />
          </AuthWrapper>
        } />
        
      </Routes>
    </div>
    </AppContext>
    <ToastContainer />
    </>
  )
}

export default App