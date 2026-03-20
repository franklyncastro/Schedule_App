import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage    from './components/LandingPage.jsx'
import BookingPage    from './components/booking/BookingPage.jsx'
import ConfirmPage    from './components/booking/ConfirmPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<LandingPage />} />
        <Route path="/agendar"       element={<BookingPage />} />
        <Route path="/confirmar/:id" element={<ConfirmPage />} />
      </Routes>
    </BrowserRouter>
  )
}
