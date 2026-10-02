import Link from "next/link";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { getCurrentUser } from "@/app/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getCurrentUser();
  if (user?.role === "USER") {
    if (!user.department) {
      redirect("/login");
    }
    redirect(`/sectors/${user.department.code}`);
  }
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />

      <main className="flex-1 px-6 py-12 md:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Hero section */}
          <div className="mb-12 text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
              Sistem za upravljanje proizvodnjom
            </p>

            <h1 className="mt-3 text-5xl font-bold text-gray-900">
              MES Propulzija
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-xl text-gray-700">
              Kompletan sistem za upravljanje proizvodnjom,
              praćenje operacija i optimizaciju proizvodnog procesa
            </p>
          </div>

          {!user ? (
            <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <p className="text-gray-700">Prijavite se da biste pristupili proizvodnim podacima.</p>
              <div className="flex gap-3">
                <Link href="/login" className="rounded-md bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700">Prijava</Link>
                <Link href="/register" className="rounded-md border border-gray-300 px-5 py-2 font-semibold text-gray-700 hover:bg-gray-50">Registracija</Link>
              </div>
            </div>
          ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              href="/products"
              title="Proizvodi"
              description="Upravljanje proizvodima i BOM strukturom"
              icon="📦"
              color="blue"
            />

            <DashboardCard
              href="/production"
              title="Proizvodnja"
              description="Pregled proizvodnog procesa u realnom vremenu"
              icon="🏭"
              color="purple"
            />

            <DashboardCard
              href={user.role === "ADMIN" ? "/sectors" : `/sectors/${user.department?.code ?? ""}`}
              title="Sektori"
              description="Pregled sektora i trenutnih poslova po sektorima"
              icon="🏢"
              color="blue"
            />

            <DashboardCard
              href="/work-orders"
              title="Radni nalozi"
              description="Kreiranje i praćenje radnih narudžbina"
              icon="📋"
              color="orange"
            />
          </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function DashboardCard({
  href,
  title,
  description,
  icon,
  color = "blue",
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
  color?: "blue" | "green" | "orange" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-100 hover:border-blue-200 hover:from-blue-50",
    green: "bg-green-100 hover:border-green-200 hover:from-green-50",
    orange: "bg-orange-100 hover:border-orange-200 hover:from-orange-50",
    purple: "bg-purple-100 hover:border-purple-200 hover:from-purple-50",
  };

  const textColorClasses = {
    blue: "group-hover:text-blue-600",
    green: "group-hover:text-green-600",
    orange: "group-hover:text-orange-600",
    purple: "group-hover:text-purple-600",
  };

  const iconBgClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg ${colorClasses[color]}`}
    >
      <div className="relative">
        <div
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg text-2xl ${iconBgClasses[color]}`}
        >
          {icon}
        </div>

        <h3
          className={`text-lg font-bold text-gray-900 ${textColorClasses[color]}`}
        >
          {title}
        </h3>

        <p className="mt-2 text-sm text-gray-700">
          {description}
        </p>

        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-700 transition-colors group-hover:text-gray-900">
          Otvori
          <span>→</span>
        </div>
      </div>
    </Link>
  );
}