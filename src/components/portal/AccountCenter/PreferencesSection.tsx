"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function PreferencesSection() {
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    language: "en",
    theme: "system",
    timezone: "UTC",
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    weeklyDigest: true,
    remindersBefore: "7days",
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch("/api/users/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) throw new Error("Failed to save preferences");

      toast.success("Preferences updated successfully");
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: string) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof preferences],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Display Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Display</CardTitle>
          <CardDescription>Customize how the platform looks to you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <Select
              value={preferences.language}
              onValueChange={(value) =>
                setPreferences((prev) => ({ ...prev, language: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية (Arabic)</SelectItem>
                <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <Select
              value={preferences.theme}
              onValueChange={(value) =>
                setPreferences((prev) => ({ ...prev, theme: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System (Default)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Timezone</label>
            <Select
              value={preferences.timezone}
              onValueChange={(value) =>
                setPreferences((prev) => ({ ...prev, timezone: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                <SelectItem value="GST">GST (Gulf Standard Time)</SelectItem>
                <SelectItem value="EET">EET (Eastern European Time)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive updates via email</p>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onCheckedChange={() => handleToggle("emailNotifications")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">SMS Notifications</p>
              <p className="text-sm text-gray-600">Receive alerts via SMS</p>
            </div>
            <Switch
              checked={preferences.smsNotifications}
              onCheckedChange={() => handleToggle("smsNotifications")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-gray-600">Browser and app notifications</p>
            </div>
            <Switch
              checked={preferences.pushNotifications}
              onCheckedChange={() => handleToggle("pushNotifications")}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="font-medium">Weekly Digest</p>
              <p className="text-sm text-gray-600">Summary email every Sunday</p>
            </div>
            <Switch
              checked={preferences.weeklyDigest}
              onCheckedChange={() => handleToggle("weeklyDigest")}
            />
          </div>

          <div className="pt-4 border-t">
            <label className="block text-sm font-medium mb-2">Reminders</label>
            <Select
              value={preferences.remindersBefore}
              onValueChange={(value) =>
                setPreferences((prev) => ({ ...prev, remindersBefore: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1day">1 day before</SelectItem>
                <SelectItem value="3days">3 days before</SelectItem>
                <SelectItem value="7days">7 days before</SelectItem>
                <SelectItem value="14days">14 days before</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">Reset to Default</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
