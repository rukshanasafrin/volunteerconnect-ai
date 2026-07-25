import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import API from '../api'

export default function VerifyCertificate() {
  const { certificateId } = useParams()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get(`/certificates/verify/${certificateId}`)
      .then(res => setResult(res.data))
      .catch(err => setResult(err.response?.data || { valid: false, message: 'Could not verify this certificate.' }))
      .finally(() => setLoading(false))
  }, [certificateId])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <Link to="/" className="text-primary font-bold text-lg">VolunteerConnect</Link>

        {loading && (
          <div className="mt-8">
            <p className="text-4xl mb-3">⏳</p>
            <p className="text-gray-500">Verifying certificate...</p>
          </div>
        )}

        {!loading && result?.valid && (
          <div className="mt-8">
            <p className="text-5xl mb-3">✅</p>
            <h2 className="text-xl font-bold text-secondary">Certificate Verified</h2>
            <div className="mt-6 text-left bg-gray-50 rounded-xl p-4 space-y-2">
              <p><span className="text-gray-400 text-sm">Awarded to</span><br /><span className="font-bold text-gray-800">{result.volunteerName}</span></p>
              <p><span className="text-gray-400 text-sm">For</span><br /><span className="font-semibold text-gray-800">{result.eventTitle}</span></p>
              <p><span className="text-gray-400 text-sm">Organization</span><br /><span className="text-gray-700">{result.orgName}</span></p>
              <p><span className="text-gray-400 text-sm">Event date</span><br /><span className="text-gray-700">{new Date(result.eventDate).toLocaleDateString()}</span></p>
              {result.hoursCertified > 0 && (
                <p><span className="text-gray-400 text-sm">Hours contributed</span><br /><span className="text-gray-700">{result.hoursCertified}</span></p>
              )}
              <p className="pt-2 border-t border-gray-200 text-xs text-gray-400">Certificate ID: {result.certificateId}</p>
            </div>
          </div>
        )}

        {!loading && !result?.valid && (
          <div className="mt-8">
            <p className="text-5xl mb-3">❌</p>
            <h2 className="text-xl font-bold text-red-600">Not a Valid Certificate</h2>
            <p className="text-gray-400 text-sm mt-2">{result?.message || 'This certificate ID could not be found.'}</p>
          </div>
        )}
      </div>
    </div>
  )
}