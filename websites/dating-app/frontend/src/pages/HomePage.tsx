export default function HomePage() {
  return (
    <div className="p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Dating App
          </h1>
          <p className="text-gray-600 mb-8">
            Find your perfect match
          </p>
          <div className="space-y-4">
            <a
              href="/discovery"
              className="btn-mobile bg-primary-600 text-white w-full block text-center"
            >
              Start Discovering
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

