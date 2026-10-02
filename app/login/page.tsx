import AuthForm from "@/app/components/auth-form";
import Footer from "@/app/components/footer";
import Header from "@/app/components/header";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <AuthForm mode="login" />
      <Footer />
    </div>
  );
}
