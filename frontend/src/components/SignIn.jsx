import { useState } from 'react';
import logo from '@/assets/images/logo.svg';
import background from '@/assets/images/background.png';
import Toast from './Toast';

function SignIn({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

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
        showToast(errorData.detail || 'Login failed. Please check your credentials.', 'error');
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

      showToast('Login successful! Welcome back! 🎉', 'success');
      
      // Small delay to show the success message before transitioning
      setTimeout(() => {
        onLogin(email);
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      showToast('Network error. Please check your connection and try again.', 'error');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail }),
      });
      
      if (response.ok) {
        showToast('📧 Password reset link sent! Check your email inbox and spam folder.', 'success');
        setShowForgotPassword(false);
        setForgotEmail('');
      } else {
        showToast('Failed to send reset email. Please try again or contact support.', 'error');
      }
    } catch (error) {
      showToast('Network error. Please check your connection and try again.', 'error');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="bg-white rounded-2xl p-8 w-[90%] max-w-md shadow-2xl space-y-6 bg-opacity-95">
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

          {/* Forgot Password Button */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-yellow-600 hover:text-yellow-500 transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          {/* Footer */}
          <p className="text-xs text-center text-gray-500">
            © {new Date().getFullYear()} Verztec Consulting Pte Ltd. All rights reserved.
          </p>
        </div>

        {/* Enhanced Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 w-[90%] max-w-md mx-4 transform transition-all duration-300 scale-100">
              
              {/* Top Graphic - Signpost Illustration */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-yellow-50 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-yellow-600 dark:text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ display: 'block' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-3" style={{ fontFamily: 'Inter, Poppins, sans-serif' }}>
                Forgot your password?
              </h2>

              {/* Subtitle */}
              <p className="text-center text-gray-500 dark:text-gray-400 mb-8 text-sm leading-relaxed">
                Enter your email so that we can send you password reset link
              </p>

              {/* Form */}
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g. username@verztec.com"
                    required
                  />
                </div>

                {/* Send Email Button */}
                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                >
                  {forgotPasswordLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Send Email</span>
                    </>
                  )}
                </button>

                {/* Back to Login */}
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors py-2"
                  disabled={forgotPasswordLoading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm">Back to Login</span>
                </button>
              </form>
            </div>
          </div>
        )}

        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap');
        `}</style>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </>
  );
}

export default SignIn;