import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage  from './components/LandingPage.jsx'
import BookingPage  from './components/booking/BookingPage.jsx'
import ConfirmPage  from './components/booking/ConfirmPage.jsx'
import AdminLogin   from './components/admin/AdminLogin.jsx'
import AdminPanel   from './components/admin/AdminPanel.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<LandingPage />} />
        <Route path="/agendar"       element={<BookingPage />} />
        <Route path="/confirmar/:id" element={<ConfirmPage />} />
        <Route path="/admin"         element={<AdminLogin />} />
        <Route path="/admin/panel"   element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  )
}