import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider.jsx'

function NavigationBar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="nav">
      <Link to="/" className="brand">
        <span className="brand-mark" aria-hidden>AB</span>
        <div>
          <div className="brand-title">A Bookshelf</div>
          <div className="brand-subtitle">Personal library HQ</div>
        </div>
      </Link>
      <nav className="nav-links" aria-label="Primary">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Dashboard
        </NavLink>
        <NavLink to="/bookshelf" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Bookshelf
        </NavLink>
        <NavLink to="/add" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Smart Add
        </NavLink>
      </nav>
      <div className="nav-actions">
        {user ? (
          <>
            <span className="nav-email">{user.email}</span>
            <button type="button" className="ghost" onClick={handleSignOut}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="ghost">
              Log in
            </Link>
            <Link to="/signup" className="primary">
              Create account
            </Link>
          </>
        )}
      </div>
    </header>
  )
}

export default NavigationBar
