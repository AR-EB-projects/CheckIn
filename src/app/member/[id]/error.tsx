'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
      <div className="text-center">
        <div className="text-gold mb-4" style={{ fontSize: '3rem' }}>⚠️</div>
        <h2 className="text-gold mb-4">Възникна грешка</h2>
        <p className="text-secondary mb-6">
          Неуспешно зареждане на информация за клиента.
        </p>
        <button
          onClick={reset}
          className="btn btn-primary"
        >
          Опитай отново
        </button>
      </div>
    </div>
  )
}