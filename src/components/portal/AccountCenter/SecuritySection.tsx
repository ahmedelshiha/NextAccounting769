"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TwoFactorSetup } from "@/components/portal/TwoFactorSetup";
import { Loader2, AlertTriangle, CheckCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";

interface Session {
  id: string;
  device: string;
  lastSeen: string;
  ipAddress: string;
  current: boolean;
}

export function SecuritySection() {
  const { data: session } = useSession();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: "session-1",
      device: "Chrome on macOS",
      lastSeen: "Now",
      ipAddress: "192.168.1.1",
      current: true,
    },
    {
      id: "session-2",
      device: "Safari on iPhone",
      lastSeen: "2 hours ago",
      ipAddress: "192.168.1.50",
      current: false,
    },
  ]);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setIsRevoking(sessionId);
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to revoke session");

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Session revoked");
    } catch (error) {
      toast.error("Failed to revoke session");
    } finally {
      setIsRevoking(null);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    try {
      const response = await fetch("/api/sessions/revoke-others", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to revoke sessions");

      setSessions((prev) => prev.filter((s) => s.current));
      toast.success("All other sessions revoked");
    } catch (error) {
      toast.error("Failed to revoke sessions");
    }
  };

  return (
    <div className="space-y-4">
      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              {mfaEnabled ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              )}
              <div>
                <p className="font-medium">
                  {mfaEnabled ? "Enabled" : "Disabled"}
                </p>
                <p className="text-sm text-gray-600">
                  {mfaEnabled
                    ? "Your account is protected with 2FA"
                    : "Enable 2FA to protect your account"}
                </p>
              </div>
            </div>
          </div>

          {!mfaEnabled && !showTwoFactorSetup && (
            <Button onClick={() => setShowTwoFactorSetup(true)} className="w-full">
              Enable Two-Factor Authentication
            </Button>
          )}

          {showTwoFactorSetup && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <TwoFactorSetup
                userId={session?.user?.id || ""}
                onComplete={() => {
                  setMfaEnabled(true);
                  setShowTwoFactorSetup(false);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage your login sessions and devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.length > 0 && (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{session.device}</p>
                      {session.current && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Last seen: {session.lastSeen}
                    </p>
                    <p className="text-xs text-gray-500">IP: {session.ipAddress}</p>
                  </div>
                  {!session.current && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={isRevoking === session.id}
                    >
                      {isRevoking === session.id && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={handleRevokeAllOtherSessions}
          >
            Sign Out All Other Sessions
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your password regularly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              You last changed your password 30 days ago.
            </AlertDescription>
          </Alert>
          <Button variant="outline" className="w-full">
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Account Deletion */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Deleting your account is permanent and cannot be undone. All your data will be
              permanently removed.
            </AlertDescription>
          </Alert>
          <Button variant="destructive" className="w-full">
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
