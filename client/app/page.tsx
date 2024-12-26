import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black relative overflow-hidden">
      {/* gradient bg */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-purple-900/20 to-slate-900" />
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/30 rounded-full mix-blend-multiply filter blur-[128px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-indigo-500/30 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-4000"></div>
      </div>

      {/* content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 rotate-12 transform hover:rotate-0 transition-transform duration-300" />
          <h1 className="text-6xl md:text-8xl font-bold ml-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            Apex
          </h1>
        </div>
        <p className="text-3xl md:text-4xl font-light text-white/90 mb-4">
          Where Financial Excellence Meets Innovation
        </p>
        <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
          Experience next-generation financial management with AI-powered
          insights, real-time analytics, and predictive forecasting.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link href="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-6 text-lg rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/20 hover:border-white/40 text-zinc-800 px-8 py-6 text-lg rounded-xl backdrop-blur-sm transition-all duration-200"
            >
              Sign In
            </Button>
          </Link>
        </div>

        {/* features */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
          {["Analytics", "Forecasting", "Security"].map((feature, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-200"
            >
              <h3 className="text-white text-lg font-semibold mb-2">
                {feature}
              </h3>
              <p className="text-slate-400 text-sm">
                Advanced {feature.toLowerCase()} powered by cutting-edge
                technology
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
