export default function Loading() {
  return (
    <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
      <div className="text-center">
        <div className="loading mb-4"></div>
        <p className="text-secondary">Зареждане...</p>
      </div>
    </div>
  )
}