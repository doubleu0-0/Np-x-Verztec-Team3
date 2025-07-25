import React, { useState } from 'react';
const remoteip = import.meta.env.VITE_REMOTE_IP

const Feedback = ({ userProfile, isDarkMode }) => {
  const [feedback, setFeedback] = useState({
    category: 'general',
    message: '',
    rating: 5
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { value: 'general', label: 'General', showRating: true },
    { value: 'bug', label: 'Bug', showRating: false },
    { value: 'feature', label: 'Feature Request', showRating: false }
  ];

  const currentCategory = categories.find(cat => cat.value === feedback.category);
  const shouldShowRating = currentCategory?.showRating ?? true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://${remoteip}:8000/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: feedback.category,
          message: feedback.message,
          rating: shouldShowRating ? feedback.rating : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      const result = await response.json();
      setSubmitted(true);
      setFeedback({ category: 'general', message: '', rating: 5 });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setFeedback({ category: 'general', message: '', rating: 5 });
  };

  if (submitted) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className={`max-w-md w-full p-8 rounded-lg text-center ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border shadow-lg`}>
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Thank You!
          </h2>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Your feedback has been submitted successfully. We appreciate your input and will use it to improve our service.
          </p>
          <button
            onClick={handleReset}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-3 px-4 rounded-md transition-colors"
          >
            Submit Another Feedback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto">
        <div className={`rounded-lg p-8 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border shadow-lg`}>
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            We Value Your Feedback
          </h1>
          <p className={`mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Help us improve by sharing your thoughts, suggestions, or reporting any issues you've encountered.
          </p>

          <div className="space-y-6">
            {/* Category Selection */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Feedback Category
              </label>
              <select
                value={feedback.category}
                onChange={(e) => setFeedback(prev => ({ ...prev, category: e.target.value }))}
                className={`w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating */}
            {shouldShowRating && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Overall Rating
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                      className={`text-2xl transition-colors ${
                        star <= feedback.rating ? 'text-yellow-500' : 'text-gray-300'
                      } hover:text-yellow-500`}
                    >
                      ★
                    </button>
                  ))}
                  <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    ({feedback.rating}/5)
                  </span>
                </div>
              </div>
            )}

            {/* Message */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Your Message
              </label>
              <textarea
                value={feedback.message}
                onChange={(e) => setFeedback(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Please share your feedback, suggestions, or describe any issues you've encountered..."
                rows={6}
                className={`w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors resize-vertical ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                required
                minLength={10}
              />
              <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Minimum 10 characters required
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || feedback.message.length < 10}
                className={`px-6 py-3 rounded-md font-medium transition-colors ${
                  isSubmitting || feedback.message.length < 10
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-yellow-500 hover:bg-yellow-600 text-black'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Feedback'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;