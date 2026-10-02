import { requireAdminPage } from "@/app/lib/auth";
import Footer from "@/app/components/footer";
import Header from "@/app/components/header";
import UsersSettings from "./users-settings";

export default async function UsersSettingsPage() {
  await requireAdminPage();
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 md:px-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Podešavanje korisnika
        </h1>
        <p className="mb-8 text-gray-600">
          Odobrite registracije, dodelite sektore i upravljajte pristupom.
        </p>
        <UsersSettings />
      </main>
      <Footer />
    </div>
  );
}
