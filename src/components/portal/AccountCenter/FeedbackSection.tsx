'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Star, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

export function FeedbackSection() {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [allowContact, setAllowContact] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    if (feedback.trim().length < 10) {
      toast.error('Please provide at least 10 characters of feedback')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment: feedback,
          allowContact,
        }),
      })

      if (!response.ok) throw new Error('Failed to submit feedback')

      toast.success('Thank you for your feedback!')
      setSubmitted(true)
      setTimeout(() => {
        setRating(0)
        setFeedback('')
        setAllowContact(false)
        setSubmitted(false)
      }, 2000)
    } catch (error) {
      toast.error('Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="inline-block p-3 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-bold mb-2">Thank You!</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your feedback helps us improve the platform
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Rate Your Experience
          </CardTitle>
          <CardDescription>Help us improve by sharing your feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating Stars */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">How would you rate your experience?</label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none transition transform hover:scale-110"
                  >
                    <Star
                      className={`h-12 w-12 transition ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              )}
            </div>

            {/* Feedback Text */}
            <div className="space-y-2">
              <label htmlFor="feedback" className="block text-sm font-medium">
                Tell us more (optional)
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What could we improve? What did you like?"
                className="w-full px-4 py-3 border rounded-lg resize-none dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
              <p className="text-xs text-gray-500">
                {feedback.length}/500 characters
              </p>
            </div>

            {/* Contact Permission */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allowContact"
                checked={allowContact}
                onChange={(e) => setAllowContact(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="allowContact" className="text-sm cursor-pointer">
                You can contact me about this feedback
              </label>
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Rating Benefits Card */}
      <Card className="bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100 text-sm">
            Why Your Feedback Matters
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <p>✓ Help us prioritize new features</p>
          <p>✓ Identify areas for improvement</p>
          <p>✓ Build a product that works for you</p>
        </CardContent>
      </Card>
    </div>
  )
}
