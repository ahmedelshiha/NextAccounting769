"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [status, setStatus] = useState<"loading" | "register" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const token = searchParams.get("token");
  const tenantId = searchParams.get("tenantId");

  useEffect(() => {
    if (!token || !tenantId) {
      setStatus("error");
      setErrorMessage("Invalid or missing invitation token");
      return;
    }

    // If user is already logged in, accept the invitation
    if (session?.user?.id) {
      acceptInvitation();
    } else {
      // Redirect to register/login with invitation token
      setStatus("register");
    }
  }, [session, token, tenantId]);

  const acceptInvitation = async () => {
    if (!token || !session?.user?.id) return;

    try {
      setStatus("loading");
      const response = await fetch("/api/auth/accept-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          userId: session.user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to accept invitation");
      }

      setStatus("success");
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/portal/dashboard");
      }, 2000);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while accepting the invitation"
      );
    }
  };

  const handleSignInAndAccept = async () => {
    // Sign in and come back to this page
    await signIn("email", {
      callbackUrl: `/auth/accept-invitation?token=${token}&tenantId=${tenantId}`,
    });
  };

  const handleCreateAccount = () => {
    router.push(
      `/register?invitation=${token}&tenantId=${tenantId}`
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="max-w-md w-full">
        {status === "loading" && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing Invitation
              </CardTitle>
              <CardDescription>
                Setting up your account...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-center">
                <div className="animate-pulse h-2 bg-blue-200 rounded"></div>
                <div className="animate-pulse h-2 bg-blue-200 rounded w-5/6 mx-auto"></div>
              </div>
            </CardContent>
          </>
        )}

        {status === "register" && (
          <>
            <CardHeader>
              <CardTitle>You&apos;re Invited!</CardTitle>
              <CardDescription>
                Complete your registration to accept this invitation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  You need to create an account or sign in to accept this invitation.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button
                  onClick={handleCreateAccount}
                  className="w-full"
                  size="lg"
                >
                  Create Account
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300"></span>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleSignInAndAccept}
                  className="w-full"
                  size="lg"
                >
                  Sign In
                </Button>
              </div>

              <p className="text-xs text-gray-600 text-center">
                By continuing, you agree to our{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </CardContent>
          </>
        )}

        {status === "success" && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Invitation Accepted!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Welcome! Your account is now set up. You&apos;ll be redirected to the dashboard shortly.
                </AlertDescription>
              </Alert>

              <Button
                className="w-full"
                onClick={() => router.push("/portal/dashboard")}
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </>
        )}

        {status === "error" && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                Invitation Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/")}
                >
                  Go Home
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/contact")}
                >
                  Contact Support
                </Button>
              </div>

              <p className="text-xs text-gray-600 text-center">
                The invitation may have expired. Please contact the person who sent you the invitation to request a new one.
              </p>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
