import { Outlet, useLocation } from 'react-router-dom'
import NavigationBar from './components/NavigationBar.jsx'
import './App.css'

function App() {
  const location = useLocation()
  const hideNav = location.pathname === '/login' || location.pathname === '/signup'

  return (
    <div className="shell">
      {!hideNav && <NavigationBar />}
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default App
