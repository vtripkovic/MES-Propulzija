import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-gray-50 py-8 mt-auto">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              MES Propulzija
            </p>
            <p className="mt-1 text-xs text-gray-700">
              Manufacturing Execution System
            </p>
          </div>

          <nav className="flex flex-wrap gap-6">
            <Link
              href="/products"
              className="text-xs text-gray-700 hover:text-gray-900"
            >
              Proizvodi
            </Link>
            <Link
              href="/machines"
              className="text-xs text-gray-700 hover:text-gray-900"
            >
              Mašine
            </Link>
            <Link
              href="/production"
              className="text-xs text-gray-700 hover:text-gray-900"
            >
              Proizvodnja
            </Link>
          </nav>

          <p className="text-xs text-gray-500">
            © {year} Propulzija. Sva prava zadržana.
          </p>
        </div>
      </div>
    </footer>
  );
}

