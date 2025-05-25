import { useState } from 'react';

function SignIn({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || 'Login failed');
        return;
      }

      const data = await response.json();
      const token = data.access_token;

      // Store token (localStorage for now)
      localStorage.setItem('token', token);

      // Optional: Fetch profile info
      const profileRes = await fetch('http://localhost:8000/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const profileData = await profileRes.json();
      console.log("User profile:", profileData);

      onLogin(email);  // You can pass `profileData.message` instead if needed
    } catch (error) {
      console.error('Login error:', error);
      alert('Login error. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[90%] max-w-md shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-4">Sign In</h2>
        <form onSubmit={handleSignIn} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Corporate Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border px-4 py-2 rounded-lg"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border px-4 py-2 rounded-lg"
            required
          />
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignIn;
