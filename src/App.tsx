import MobileLogin from './components/MobileLogin'
import { ToastContainer } from './components/Toast'
import './App.css'

function App() {
  return (
    <div className="app">
      <ToastContainer />
      <header className="app-header">
        <h1>QR Login System</h1>
        <p>Secure authentication with QR codes</p>
      </header>
      
      <MobileLogin />
    </div>
  )
}

export default App