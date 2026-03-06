'use client'

import { useState, useEffect, use } from 'react'

interface Member {
  id: number
  name: string
  visits_total: number
  visits_used: number
}

export default function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Mock data - в реалност тук ще има API call
    const mockMember: Member = {
      id: parseInt(resolvedParams.id),
      name: 'Anna Petrova',
      visits_total: 8,
      visits_used: 4
    }

    setTimeout(() => {
      setMember(mockMember)
      setLoading(false)
    }, 500)
  }, [resolvedParams.id])

  const remaining = member ? member.visits_total - member.visits_used : 0
  const isExhausted = remaining <= 0

  if (loading) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="loading mb-4"></div>
          <p className="text-secondary">Зареждане...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="alert alert-error">
          <h3 className="mb-2">Грешка</h3>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="alert alert-warning">
          <h3 className="mb-2">Член не е намерен</h3>
          <p>Не съществува член с ID: {resolvedParams.id}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex items-center justify-center fade-in" style={{ minHeight: '100vh' }}>
      <div className="member-card" style={{ maxWidth: '420px', width: '100%' }}>
        <div className="text-center mb-6">
          <div className="text-gold mb-3" style={{ fontSize: '2.5rem' }}>♦</div>
          <h1 className="member-name">{member.name}</h1>
        </div>

        <div className="visit-info mb-6">
          <div className="visit-item">
            <span className="visit-number">{member.visits_total}</span>
            <div className="visit-label">Карта</div>
          </div>
          <div className="visit-item">
            <span className="visit-number">{member.visits_used}</span>
            <div className="visit-label">Използвани</div>
          </div>
          <div className="visit-item">
            <span className={`visit-number ${isExhausted ? 'text-error' : 'text-gold'}`}>
              {remaining}
            </span>
            <div className="visit-label">Остават</div>
          </div>
        </div>

        {isExhausted && (
          <div className="alert alert-warning mb-6">
            <strong>Картата е изчерпана</strong>
            <p className="mt-2 mb-0">Няма оставащи посещения. Моля, свържете се с администратор.</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            Dalida Dance Studio
          </p>
          <p className="text-muted" style={{ fontSize: '0.75rem' }}>
            NFC Check-in System
          </p>
        </div>
      </div>
    </div>
  )
}