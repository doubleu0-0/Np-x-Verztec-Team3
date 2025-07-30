import { useState, useEffect } from 'react';
import { MessageSquare, Star, Bug, Lightbulb, Eye, Check, Clock, AlertCircle, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
const remoteip = import.meta.env.VITE_REMOTE_IP

const ViewFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    rating: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedFeedback, setExpandedFeedback] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://${remoteip}:8000/api/feedback`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.detail || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setFeedbacks(data);
      
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      setError(err.message || 'Failed to fetch feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://${remoteip}:8000/api/feedback/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.detail || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      // Update local state
      setFeedbacks(feedbacks.map(feedback => 
        feedback.id === id ? { 
          ...feedback, 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        } : feedback
      ));
      
    } catch (err) {
      console.error('Error updating feedback status:', err);
      setError(`Failed to update feedback status: ${err.message}`);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'general':
        return <MessageSquare className="w-4 h-4" />;
      case 'bug':
        return <Bug className="w-4 h-4" />;
      case 'feature':
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'general':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'bug':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'feature':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'reviewed':
        return <Eye className="w-4 h-4" />;
      case 'resolved':
        return <Check className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
          ({rating}/5)
        </span>
      </div>
    );
  };

  const filteredAndSortedFeedbacks = feedbacks
    .filter(feedback => {
      const matchesCategory = filters.category === 'all' || feedback.category === filters.category;
      const matchesStatus = filters.status === 'all' || feedback.status === filters.status;
      const matchesRating = filters.rating === 'all' || 
        (filters.rating === 'with-rating' && feedback.rating) ||
        (filters.rating === 'no-rating' && !feedback.rating);
      const matchesSearch = feedback.message.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesStatus && matchesRating && matchesSearch;
    })
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mx-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700 dark:text-red-300 font-medium">Error loading feedbacks</span>
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        <button
          onClick={fetchFeedbacks}
          className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-full">
      {/* Mobile Search and Filter Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        {/* Search Bar - Always visible */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search feedback..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
          />
        </div>

        {/* Filter Toggle Button for Mobile */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 w-full md:hidden px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>Filters & Sort</span>
          {showFilters ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
        </button>

        {/* Filters - Desktop always visible, Mobile toggleable */}
        <div className={`${showFilters ? 'block' : 'hidden'} md:block space-y-4 ${showFilters ? 'mt-4' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
            </select>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>

            {/* Rating Filter */}
            <select
              value={filters.rating}
              onChange={(e) => setFilters({...filters, rating: e.target.value})}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
            >
              <option value="all">All Ratings</option>
              <option value="with-rating">With Rating</option>
              <option value="no-rating">No Rating</option>
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="created_at">Date Created</option>
                <option value="updated_at">Date Updated</option>
                <option value="rating">Rating</option>
                <option value="status">Status</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                {sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats - Mobile optimized grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{feedbacks.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Pending</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {feedbacks.filter(f => f.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Eye className="w-5 h-5 text-blue-500" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Reviewed</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {feedbacks.filter(f => f.status === 'reviewed').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Resolved</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {feedbacks.filter(f => f.status === 'resolved').length}
          </p>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Feedback ({filteredAndSortedFeedbacks.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredAndSortedFeedbacks.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No feedback found matching your criteria.
            </div>
          ) : (
            filteredAndSortedFeedbacks.map((feedback) => (
              <div key={feedback.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="space-y-3">
                  {/* Top row - badges and rating */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(feedback.category)}`}>
                      {getCategoryIcon(feedback.category)}
                      <span className="hidden sm:inline">{feedback.category}</span>
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(feedback.status)}`}>
                      {getStatusIcon(feedback.status)}
                      <span className="hidden sm:inline">{feedback.status}</span>
                    </span>
                    {feedback.rating && (
                      <div className="ml-auto">
                        {renderStars(feedback.rating)}
                      </div>
                    )}
                  </div>

                  {/* Message content */}
                  <div>
                    <p className={`text-gray-900 dark:text-white ${expandedFeedback === feedback.id ? '' : 'line-clamp-3'}`}>
                      {feedback.message}
                    </p>
                    {feedback.message.length > 150 && (
                      <button
                        onClick={() => setExpandedFeedback(expandedFeedback === feedback.id ? null : feedback.id)}
                        className="text-yellow-600 hover:text-yellow-700 text-sm mt-2 transition-colors"
                      >
                        {expandedFeedback === feedback.id ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>

                  {/* Bottom row - dates and actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Created: {formatDate(feedback.created_at)}</span>
                      {feedback.updated_at !== feedback.created_at && (
                        <span>Updated: {formatDate(feedback.updated_at)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {feedback.status === 'pending' && (
                        <button
                          onClick={() => updateFeedbackStatus(feedback.id, 'reviewed')}
                          className="px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors touch-manipulation"
                        >
                          Mark as Reviewed
                        </button>
                      )}
                      {feedback.status === 'reviewed' && (
                        <button
                          onClick={() => updateFeedbackStatus(feedback.id, 'resolved')}
                          className="px-3 py-2 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors touch-manipulation"
                        >
                          Mark as Resolved
                        </button>
                      )}
                      {feedback.status === 'resolved' && (
                        <span className="px-3 py-2 text-sm bg-green-100 text-green-800 rounded-lg">
                          Resolved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewFeedback;
