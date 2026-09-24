import React, { useState } from 'react';
import { MessageSquare, Star, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { trackEvent } from '../utils/analytics';

interface FeedbackWidgetProps {
  currentToolName?: string;
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ currentToolName = 'General' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'feedback' | 'bug'>('feedback');
  
  // Feedback form
  const [rating, setRating] = useState(5);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  
  // Bug report form
  const [category, setCategory] = useState('Conversion Error');
  const [bugMsg, setBugMsg] = useState('');
  
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'feedback') {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, message: feedbackMsg, tool_name: currentToolName })
        });
        if (res.ok) {
          trackEvent('feedback_submit', currentToolName);
          setSubmitted(true);
        } else {
          setError('Failed to submit feedback');
        }
      } else {
        const res = await fetch('/api/bugs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool_name: currentToolName, problem_category: category, message: bugMsg })
        });
        if (res.ok) {
          trackEvent('bug_report', currentToolName);
          setSubmitted(true);
        } else {
          setError('Failed to submit bug report');
        }
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => { setIsOpen(true); setSubmitted(false); }}
          className="px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Feedback & Support</span>
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-6">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Thank You!</h3>
                <p className="text-xs text-slate-600">Your input has been recorded successfully to help improve ResizeToKB Suite.</p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2 border-b border-slate-200 pb-4">
                  <button
                    onClick={() => setMode('feedback')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      mode === 'feedback' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Rate Experience
                  </button>
                  <button
                    onClick={() => setMode('bug')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      mode === 'bug' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Report a Problem
                  </button>
                </div>

                {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl">{error}</div>}

                <form onSubmit={submitFeedback} className="space-y-4">
                  {mode === 'feedback' ? (
                    <>
                      <div className="space-y-2 text-center">
                        <label className="text-xs font-bold text-slate-700">How was your experience with {currentToolName}?</label>
                        <div className="flex justify-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setRating(star)}
                              className={`text-2xl transition-transform hover:scale-110 cursor-pointer ${
                                star <= rating ? 'text-amber-400' : 'text-slate-300'
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">What can we improve? (Optional)</label>
                        <textarea
                          value={feedbackMsg}
                          onChange={(e) => setFeedbackMsg(e.target.value)}
                          placeholder="Your suggestions..."
                          className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 bg-slate-50 h-24 resize-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Problem Category</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 bg-slate-50 cursor-pointer"
                        >
                          <option value="Conversion Error">Conversion Error</option>
                          <option value="File Too Large">File Too Large / Compression Issue</option>
                          <option value="UI Glitch">UI Glitch / Mobile Issue</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Describe the issue</label>
                        <textarea
                          value={bugMsg}
                          onChange={(e) => setBugMsg(e.target.value)}
                          placeholder="Please describe what went wrong..."
                          className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 bg-slate-50 h-24 resize-none"
                          required
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Submit {mode === 'feedback' ? 'Feedback' : 'Bug Report'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
