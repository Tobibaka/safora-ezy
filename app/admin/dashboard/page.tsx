'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import QrScanner from 'react-qr-scanner'

interface TouristData {
  id: string
  walletAddress: string
  kycData: any
  createdAt: string
}

interface VisitData {
  id: string
  location: string
  notes: string
  createdAt: string
  user: TouristData
}

export default function AdminDashboard() {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<TouristData | null>(null)
  const [visits, setVisits] = useState<VisitData[]>([])
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    // Check if admin is logged in
    const userType = localStorage.getItem('userType')
    const adminId = localStorage.getItem('adminId')
    
    if (userType !== 'admin' || !adminId) {
      router.push('/admin/login')
    } else {
      fetchVisits()
    }
  }, [router])

  const fetchVisits = async () => {
    try {
      const response = await fetch('/api/admin/visits')
      const data = await response.json()
      if (response.ok) {
        setVisits(data.visits)
      }
    } catch (error) {
      console.error('Failed to fetch visits:', error)
    }
  }

  const handleScan = async (data: string | null) => {
    if (data && data.startsWith('tourist:')) {
      setIsScanning(false)
      setError('')
      setSuccess('')

      try {
        const response = await fetch('/api/admin/scan-qr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ qrCode: data }),
        })

        const result = await response.json()

        if (response.ok) {
          setScannedData(result.tourist)
        } else {
          setError(result.error || 'Failed to process QR code')
        }
      } catch (error) {
        setError('An error occurred while processing the QR code')
      }
    }
  }

  const handleError = (error: any) => {
    console.error('QR Scanner error:', error)
  }

  const recordVisit = async () => {
    if (!scannedData || !location.trim()) {
      setError('Please provide a location')
      return
    }

    setIsRecording(true)
    setError('')

    try {
      const response = await fetch('/api/admin/record-visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: scannedData.id,
          location: location.trim(),
          notes: notes.trim(),
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess('Visit recorded successfully!')
        setScannedData(null)
        setLocation('')
        setNotes('')
        fetchVisits()
      } else {
        setError(result.error || 'Failed to record visit')
      }
    } catch (error) {
      setError('An error occurred while recording the visit')
    } finally {
      setIsRecording(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('userType')
    localStorage.removeItem('adminId')
    router.push('/')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Region Administration Panel</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Scanner Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              QR Code Scanner
            </h2>

            {!isScanning && !scannedData && (
              <div className="text-center">
                <button
                  onClick={() => setIsScanning(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
                >
                  Start Scanning
                </button>
              </div>
            )}

            {isScanning && (
              <div className="space-y-4">
                <div className="relative">
                  <QrScanner
                    ref={scannerRef}
                    delay={300}
                    onError={handleError}
                    onScan={handleScan}
                    style={{ width: '100%', maxWidth: '400px' }}
                  />
                </div>
                <button
                  onClick={() => setIsScanning(false)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                >
                  Stop Scanning
                </button>
              </div>
            )}

            {scannedData && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Tourist Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Wallet Address:</span> {scannedData.walletAddress}</p>
                    <p><span className="font-medium">Member Since:</span> {new Date(scannedData.createdAt).toLocaleDateString()}</p>
                    {scannedData.kycData && (
                      <p><span className="font-medium">KYC Status:</span> Verified</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter visit location"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Additional notes about the visit"
                    />
                  </div>

                  <button
                    onClick={recordVisit}
                    disabled={isRecording || !location.trim()}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                  >
                    {isRecording ? 'Recording...' : 'Record Visit'}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-700">{success}</span>
                </div>
              </div>
            )}
          </div>

          {/* Visits History */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Recent Visits
            </h2>

            {visits.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No visits recorded yet</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {visits.map((visit) => (
                  <div key={visit.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{visit.location}</p>
                        <p className="text-sm text-gray-600">
                          {visit.user.walletAddress.slice(0, 6)}...{visit.user.walletAddress.slice(-4)}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(visit.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {visit.notes && (
                      <p className="text-sm text-gray-700 mt-2">{visit.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
