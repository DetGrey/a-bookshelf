import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider.jsx'

function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    // Validate passwords match
    if (password !== passwordConfirm) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const { error: signUpError } = await signUp(email, password)
    setLoading(false)
    if (signUpError) {
      setError(signUpError.message)
      return
    }

    setMessage('Check your email to confirm your account, then log in.')
    setEmail('')
    setPassword('')
    setPasswordConfirm('')
    navigate('/login')
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <p className="eyebrow">Create account</p>
        <h1>Start your shelf</h1>
        <p className="muted">Sign up with email and password. Supabase handles auth.</p>

        <form className="stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Confirm Password</span>
            <input
              type="password"
              name="passwordConfirm"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              required
            />
          </label>
          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create account'}
          </button>
          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}
        </form>

        <p className="muted">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}

export default Signup
