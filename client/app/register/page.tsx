"use client";
import React, { use, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import * as zod from "zod";
import { useRouter } from "next/navigation";
interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function RegisterPage() {
  const [formData, setFormData] = useState<UserFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const router = useRouter();
  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (!zod.string().email().safeParse(formData.email).success) {
      alert("Invalid email address");
      return;
    }
    if (formData.password.length < 8) {
      alert("Password must be at least 8 characters long");
      return;
    }
    if (!formData.firstName || !formData.lastName) {
      alert("First name and last name are required");
      return;
    }

    try {
      const actualFormData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      };

      const response = await fetch(`${BACKEND_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(actualFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      alert("Account created successfully");
      router.push("/login");
    } catch (error) {
      console.error("Registration error:", error);
      alert(error || "Failed to create account");
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

      {/* main content */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/[0.05] border border-white/[0.1] backdrop-blur-xl rounded-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 rotate-12 transform hover:rotate-0 transition-transform duration-300" />
            <h1 className="text-3xl font-bold text-white mt-4">
              Create Account
            </h1>
            <p className="text-slate-400 mt-2">Join Apex Finance today</p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="First Name"
                className="bg-white/[0.05] border-white/[0.1] text-white h-12"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
              />
              <Input
                type="text"
                placeholder="Last Name"
                className="bg-white/[0.05] border-white/[0.1] text-white h-12"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    lastName: e.target.value,
                  }))
                }
              />
            </div>
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
            <Input
              type="password"
              placeholder="Confirm Password"
              className="bg-white/[0.05] border-white/[0.1] text-white h-12"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
            />
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white h-12 rounded-xl transition-all duration-200"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-slate-400">
            <p>
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-indigo-400 hover:text-indigo-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
