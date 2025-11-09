import Link from 'next/link';

export default function CollegeBaseballLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-blue-600">
              Blaze Sports Intel
            </Link>

            <div className="flex space-x-6">
              <Link
                href="/sports/college-baseball"
                className="text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Schedule
              </Link>
              <Link
                href="/sports/college-baseball/rankings"
                className="text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Rankings
              </Link>
              <Link
                href="/sports/college-baseball/standings"
                className="text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Standings
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-600">
            Blaze Sports Intel © {new Date().getFullYear()} · Filling ESPN&apos;s college baseball gap
          </p>
        </div>
      </footer>
    </div>
  );
}
