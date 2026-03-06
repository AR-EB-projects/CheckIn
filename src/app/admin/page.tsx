'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean>(true) // Mock admin check
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock admin authentication check
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }, [])

  if (loading) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="loading mb-4"></div>
          <p className="text-secondary">Проверка на достъп...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="alert alert-error">
          <h3 className="mb-2">Достъп отказан</h3>
          <p>Нямате администраторски права за достъп до тази страница.</p>
          <Link href="/" className="btn btn-secondary mt-4">
            Начало
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex items-center justify-center fade-in" style={{ minHeight: '100vh' }}>
      <div className="text-center" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="text-gold mb-5" style={{ fontSize: '3.5rem' }}>♦</div>
        <h1 className="mb-3">Администраторски панел</h1>
        <p className="text-secondary mb-6" style={{ fontSize: '1rem' }}>
          Dalida Dance Studio NFC System
        </p>

        <div className="grid grid-cols-1 gap-5 mb-6">
          <Link href="/admin/members" className="card p-5 text-center hover:scale-105 transition-transform">
            <div className="text-gold mb-3" style={{ fontSize: '2.2rem' }}>👥</div>
            <h2 className="text-gold mb-2">Управление на членове</h2>
            <p className="text-secondary">
              Преглед и управление на посещенията на всички членове
            </p>
          </Link>

          <div className="card p-5 text-center opacity-50">
            <div className="text-muted mb-3" style={{ fontSize: '2.2rem' }}>📊</div>
            <h3 className="text-muted mb-2">Статистики</h3>
            <p className="text-muted">
              Предстои разработка
            </p>
          </div>

          <div className="card p-5 text-center opacity-50">
            <div className="text-muted mb-3" style={{ fontSize: '2.2rem' }}>⚙️</div>
            <h3 className="text-muted mb-2">Настройки</h3>
            <p className="text-muted">
              Предстои разработка
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-center mb-6">
          <Link href="/admin/members" className="btn btn-primary">
            Управление на членове
          </Link>
          <Link href="/" className="btn btn-secondary">
            Изход
          </Link>
        </div>

        <div className="mt-8">
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            Dalida Dance Studio Admin Panel
          </p>
          <p className="text-muted" style={{ fontSize: '0.75rem' }}>
            NFC Check-in System v1.0
          </p>
        </div>
      </div>
    </div>
  )
}
