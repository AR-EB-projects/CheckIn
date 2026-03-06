'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="container flex items-center justify-center fade-in" style={{ minHeight: '100vh' }}>
      <div className="text-center" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="text-gold mb-5" style={{ fontSize: '3.5rem' }}>♦</div>
        <h1 className="mb-3">Dalida Dance Studio</h1>
        <p className="text-secondary mb-6" style={{ fontSize: '1rem' }}>
          NFC Check-in System
        </p>

        <div className="grid grid-cols-1 gap-5 mb-6">
          <Link href="/admin" className="card p-5 text-center hover:scale-105 transition-transform">
            <div className="text-gold mb-3" style={{ fontSize: '2.2rem' }}>👤</div>
            <h2 className="text-gold mb-2">Администратор</h2>
            <p className="text-secondary">
              Вход за треньори и администратори
            </p>
          </Link>

          <div className="card p-5 text-center opacity-50">
            <div className="text-muted mb-3" style={{ fontSize: '2.2rem' }}>📱</div>
            <h3 className="text-muted mb-2">Сканирай карта</h3>
            <p className="text-muted">
              Сканирайте NFC карта за проверка
            </p>
          </div>
        </div>

        <div className="mb-6">
          <Link href="/admin" className="btn btn-primary">
            Администраторски панел
          </Link>
        </div>

        <div className="text-center mb-8">
          <p className="text-muted mb-3">
            Как работи системата:
          </p>
          <div className="text-left" style={{ maxWidth: '380px', margin: '0 auto' }}>
            <p className="text-secondary mb-2" style={{ fontSize: '0.85rem' }}>
              📱 <strong>Клиент:</strong> Сканирай NFC карта за да видиш оставащи посещения
            </p>
            <p className="text-secondary mb-2" style={{ fontSize: '0.85rem' }}>
              👤 <strong>Администратор:</strong> Влез в панела за управление на посещения
            </p>
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
              🔗 <strong>NFC карта:</strong> Съдържа URL: dalidadance.com/member/[ID]
            </p>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            Dalida Dance Studio
          </p>
          <p className="text-muted" style={{ fontSize: '0.75rem' }}>
            NFC Check-in System v1.0
          </p>
        </div>
      </div>
    </div>
  )
}