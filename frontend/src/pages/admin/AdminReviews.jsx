import React, { useState, useEffect } from 'react';
import { Star, Trash2, Calendar, MessageSquare, Loader2 } from 'lucide-react';
import API from '../../services/api';
import Sidebar from '../../components/Sidebar';
import Alert from '../../components/Alert';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [selectedReview, setSelectedReview] = useState(null);

  const fetchReviews = async () => {
    try {
      const res = await API.get('/admin/reviews');
      setReviews(res.data || []);
    } catch (err) {
      console.error('Error fetching admin reviews:', err);
      setStatus({ type: 'error', message: 'Failed to load reviews catalog.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDeleteReview = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete this review "${title}"?`)) return;

    setStatus({ type: '', message: '' });
    try {
      await API.delete(`/admin/reviews/${id}`);
      setStatus({ type: 'success', message: 'Review deleted successfully.' });
      fetchReviews();
    } catch (err) {
      console.error('Error deleting review:', err);
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete review.'
      });
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={12}
            className={i < rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-5">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Review Moderation</h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
            <span>Inspect user ratings, customer reviews, and remove flaggable content.</span>
          </p>
        </div>

        {status.message && <Alert type={status.type} message={status.message} />}

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-400 text-sm font-medium">
            No reviews submitted yet on the platform.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-2">
                <MessageSquare size={16} className="text-blue-500" />
                <span>Product Feedback Matrix</span>
              </span>
              <span>Total Reviews: {reviews.length}</span>
            </div>

            <div className="overflow-x-auto font-medium">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/30 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Product Title</th>
                    <th className="px-6 py-3.5">Author</th>
                    <th className="px-6 py-3.5">Rating</th>
                    <th className="px-6 py-3.5">Feedback Detail</th>
                    <th className="px-6 py-3.5">Attached Photo</th>
                    <th className="px-6 py-3.5">Date Submitted</th>
                    <th className="px-6 py-3.5 text-center">Delete Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {reviews.map((rev) => (
                    <tr key={rev.id} className="hover:bg-slate-50/30 transition-colors">
                      
                      {/* Product Name */}
                      <td className="px-6 py-4 font-bold text-slate-800 max-w-[150px] truncate" title={rev.product_title}>
                        {rev.product_title}
                      </td>

                      {/* Author */}
                      <td className="px-6 py-4 text-slate-700">
                        {rev.user_name}
                      </td>

                      {/* Rating Stars */}
                      <td className="px-6 py-4">
                        {renderStars(rev.rating)}
                      </td>

                      {/* Review Details */}
                      <td className="px-6 py-4 max-w-[250px]">
                        <p className="font-bold text-slate-800 truncate" title={rev.title}>{rev.title}</p>
                        {rev.comment && (
                          <p className="text-[10px] text-slate-400 mt-0.5 font-normal truncate" title={rev.comment}>
                            {rev.comment}
                          </p>
                        )}
                        <button
                          onClick={() => setSelectedReview(rev)}
                          className="mt-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-[9px] font-bold uppercase transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          Read
                        </button>
                      </td>

                      {/* Attached Image */}
                      <td className="px-6 py-4">
                        {rev.image_url ? (
                          <div 
                            className="w-10 h-10 border border-slate-100 bg-slate-50 rounded p-0.5 shrink-0 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors" 
                            onClick={() => setSelectedReview(rev)}
                          >
                            <img
                              src={rev.image_url}
                              alt="Review"
                              className="max-h-full max-w-full object-contain rounded"
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-semibold italic">None</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{new Date(rev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteReview(rev.id, rev.title)}
                          className="p-1.5 border border-slate-200 hover:bg-red-50 text-red-600 hover:border-red-200 rounded-lg transition-colors cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Selected Review Details Modal */}
        {selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100 relative animate-in zoom-in-95 duration-200">
              
              <button
                onClick={() => setSelectedReview(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="border-b border-slate-100 pb-3 pr-6">
                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider block w-fit mb-1.5">
                  Review Details
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Product Title</span>
                <p className="font-bold text-slate-800 text-sm leading-normal">{selectedReview.product_title}</p>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <div>
                  <span className="text-[9px] text-slate-400 block font-bold">Reviewer</span>
                  <span className="text-slate-700 font-bold normal-case text-sm">{selectedReview.user_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 block font-bold">Rating</span>
                  <div className="mt-0.5">{renderStars(selectedReview.rating)}</div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs text-slate-600 font-medium">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Headline</span>
                  <h4 className="font-bold text-slate-800 text-sm normal-case">{selectedReview.title}</h4>
                </div>
                <div className="h-px bg-slate-200 my-2"></div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Customer Feedback</span>
                  <p className="leading-relaxed normal-case text-slate-700 font-medium break-words max-h-40 overflow-y-auto whitespace-pre-wrap pr-1">{selectedReview.comment || "(No text comment provided)"}</p>
                </div>
              </div>

              {selectedReview.image_url && (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Attached Photo</span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 flex justify-center bg-slate-50 p-2">
                    <img
                      src={selectedReview.image_url}
                      alt="Review Product Attachment"
                      className="max-h-40 object-contain rounded-lg shadow-sm"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedReview(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteReview(selectedReview.id, selectedReview.title);
                    setSelectedReview(null);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg active:scale-95 transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1 shadow-sm"
                >
                  <Trash2 size={12} />
                  <span>Delete Review</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminReviews;
