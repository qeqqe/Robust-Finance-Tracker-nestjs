"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Bell, Globe, Moon, Sun, Wallet } from "lucide-react";

interface Settings {
  defaultCurrency: string;
  language: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
}

export default function Setting() {
  const [settings, setSettings] = useState<Settings>({
    defaultCurrency: "USD",
    language: "en",
  });

  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/settings`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
          setProfile({
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            email: data.user.email,
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchSettings();
  }, []);

  const handleSettingsSave = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/settings`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify(settings),
        }
      );

      if (response.ok) {
        toast.success("Settings updated successfully");
      } else {
        throw new Error("Failed to update settings");
      }
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSave = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify(profile),
        }
      );

      if (response.ok) {
        toast.success("Profile updated successfully");
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="flex flex-row items-center gap-2">
          <User className="h-5 w-5 text-white/70" />
          <CardTitle className="text-white">Profile Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="First Name"
              value={profile.firstName}
              onChange={(e) =>
                setProfile({ ...profile, firstName: e.target.value })
              }
              className="bg-white/5 border-white/10 text-white"
            />
            <Input
              placeholder="Last Name"
              value={profile.lastName}
              onChange={(e) =>
                setProfile({ ...profile, lastName: e.target.value })
              }
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <Input
            placeholder="Email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="bg-white/5 border-white/10 text-white"
          />
          <Button
            onClick={handleProfileSave}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            Save Profile
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="flex flex-row items-center gap-2">
          <Bell className="h-5 w-5 text-white/70" />
          <CardTitle className="text-white">App Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-white/70">Default Currency</label>
              <Select
                value={settings.defaultCurrency}
                onValueChange={(value) =>
                  setSettings({ ...settings, defaultCurrency: value })
                }
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  <SelectItem
                    value="USD"
                    className="text-white hover:bg-white/10"
                  >
                    USD
                  </SelectItem>
                  <SelectItem
                    value="EUR"
                    className="text-white hover:bg-white/10"
                  >
                    EUR
                  </SelectItem>
                  <SelectItem
                    value="GBP"
                    className="text-white hover:bg-white/10"
                  >
                    GBP
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleSettingsSave}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            Save Settings
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="flex flex-row items-center gap-2">
          <Wallet className="h-5 w-5 text-white/70" />
          <CardTitle className="text-white">Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-white/50 text-center py-8">
            Coming soon: Connect your bank accounts for automatic transaction
            import
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
