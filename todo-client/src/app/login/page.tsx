'use client'
export default function Login() {
    return (
        <div>
            <button onClick={() => {
                fetch('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email: 'test@test.com', password: 'test' })
                })
            }}>Login</button>
        </div>
    )
}