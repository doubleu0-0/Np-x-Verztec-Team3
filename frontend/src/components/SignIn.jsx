import { useState } from 'react';
import logo from '@/assets/images/logo.svg';

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

      localStorage.setItem('token', token);

      const profileRes = await fetch('http://localhost:8000/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const profileData = await profileRes.json();
      console.log("User profile:", profileData);

      onLogin(email);
    } catch (error) {
      console.error('Login error:', error);
      alert('Login error. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-[90%] max-w-md shadow-2xl space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={logo} alt="Verztec Logo" className="h-12 object-contain" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-center text-gray-800">
          Employee Sign In
        </h2>

        {/* Form */}
        <form onSubmit={handleSignIn} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Corporate Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            required
          />
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition duration-150"
          >
            Sign In
          </button>
        </form>

        {/* Footer */}
        <p className="text-xs text-center text-gray-500">
          © {new Date().getFullYear()} Verztec Consulting Pte Ltd. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default SignIn;
