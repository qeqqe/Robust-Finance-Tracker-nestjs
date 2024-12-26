"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface FormDataInterface {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  user: {
    email: string;
    firstName: string;
  };
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function LoginPage() {
  const [formData, setFormData] = useState<FormDataInterface>({
    email: "",
    password: "",
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      console.log("Full response:", {
        status: response.status,
        data: data,
      });

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (!data.access_token) {
        throw new Error("No access token received");
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      alert(error instanceof Error ? error.message : "Failed to login");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black relative overflow-hidden">
      {/* bg effect */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-purple-900/20 to-slate-900" />
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/30 rounded-full mix-blend-multiply filter blur-[128px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-indigo-500/30 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-4000"></div>
      </div>

      {/* content */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/[0.05] border border-white/[0.1] backdrop-blur-xl rounded-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 rotate-12 transform hover:rotate-0 transition-transform duration-300" />
            <h1 className="text-3xl font-bold text-white mt-4">Welcome Back</h1>
            <p className="text-slate-400 mt-2">Sign in to your account</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Input
                type="email"
                placeholder="Email"
                className="bg-white/[0.05] border-white/[0.1] text-white h-12"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                className="bg-white/[0.05] border-white/[0.1] text-white h-12"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white h-12 rounded-xl transition-all duration-200"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-slate-400">
            <p>
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-indigo-400 hover:text-indigo-300"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
