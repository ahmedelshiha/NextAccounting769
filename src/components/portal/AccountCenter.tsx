"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Lock,
  Bell,
  Palette,
  Globe,
  CreditCard,
  LogOut,
  Settings,
  Shield,
} from "lucide-react";
import { ProfileSection } from "./AccountCenter/ProfileSection";
import { PreferencesSection } from "./AccountCenter/PreferencesSection";
import { SecuritySection } from "./AccountCenter/SecuritySection";
import { BillingSection } from "./AccountCenter/BillingSection";

export function AccountCenter() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("profile");

  if (!session?.user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>Please sign in to access account settings.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Account Settings</h2>
        <p className="text-gray-600 mt-2">
          Manage your profile, security, and preferences
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <TabsTrigger value="profile" className="text-xs md:text-sm">
            <User className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Profile</span>
          </TabsTrigger>

          <TabsTrigger value="preferences" className="text-xs md:text-sm">
            <Palette className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Preferences</span>
          </TabsTrigger>

          <TabsTrigger value="security" className="text-xs md:text-sm">
            <Shield className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Security</span>
          </TabsTrigger>

          <TabsTrigger value="billing" className="text-xs md:text-sm">
            <CreditCard className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Billing</span>
          </TabsTrigger>

          <TabsTrigger value="help" className="text-xs md:text-sm">
            <Settings className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Help</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <ProfileSection />
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <PreferencesSection />
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <SecuritySection />
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <BillingSection />
        </TabsContent>

        {/* Help Tab */}
        <TabsContent value="help" className="space-y-4">
          <HelpSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HelpSection() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Help & Support</CardTitle>
          <CardDescription>Get assistance with your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">Knowledge Base</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-3">
                  Browse articles and guides on how to use the platform.
                </p>
                <button className="text-blue-600 hover:underline font-medium text-sm">
                  Visit Knowledge Base →
                </button>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg">Contact Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-3">
                  Get in touch with our support team for help.
                </p>
                <button className="text-green-600 hover:underline font-medium text-sm">
                  Start Support Chat →
                </button>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-lg">Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-3">
                  Tell us what you think about the platform.
                </p>
                <button className="text-purple-600 hover:underline font-medium text-sm">
                  Send Feedback →
                </button>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-lg">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-3">
                  Learn about the platform and our team.
                </p>
                <button className="text-orange-600 hover:underline font-medium text-sm">
                  View About →
                </button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
