import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-6 py-4 md:px-8">
        <div className="flex items-center justify-between gap-8">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            MES Propulzija
          </Link>

          <nav className="hidden gap-8 md:flex">
            <NavLink href="/products" label="Proizvodi" />
            <NavLink href="/machines" label="Mašine" />
            <NavLink href="/work-orders/new" label="Nova radna narudžbina" />
            <NavLink href="/production" label="Proizvodnja" />
          </nav>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
    >
      {label}
    </Link>
  );
}

