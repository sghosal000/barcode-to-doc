import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import './App.css'

function App() {
  return (
    <BrowserRouter basename='/'>
      <Routes>
        <Route path='*' element={<Navigate to={"/home"} replace />} />
        <Route path='/home' element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
