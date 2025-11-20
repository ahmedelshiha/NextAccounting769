"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Copy, CheckCircle, AlertTriangle, Smartphone } from "lucide-react";
import { toast } from "sonner";

export interface TwoFactorSetupProps {
  userId: string;
  onComplete?: () => void;
}

type SetupStep = "choose-method" | "totp-setup" | "sms-setup" | "backup-codes" | "complete";

export function TwoFactorSetup({ userId, onComplete }: TwoFactorSetupProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>("choose-method");
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"totp" | "sms" | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleEnrollTotp = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/mfa/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "totp" }),
      });

      if (!response.ok) {
        throw new Error("Failed to enroll TOTP");
      }

      const data = await response.json();
      setTotpUri(data.uri);
      setBackupCodes(data.backupCodes || []);
      setSelectedMethod("totp");
      setCurrentStep("totp-setup");
    } catch (error) {
      toast.error("Failed to setup TOTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollSms = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/mfa/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "sms" }),
      });

      if (!response.ok) {
        throw new Error("Failed to enroll SMS");
      }

      setSelectedMethod("sms");
      setCurrentStep("sms-setup");
    } catch (error) {
      toast.error("Failed to setup SMS");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: verificationCode,
          method: selectedMethod,
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid verification code");
      }

      toast.success("2FA setup complete!");
      setCurrentStep("complete");
      onComplete?.();
    } catch (error) {
      toast.error("Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full max-w-md">
      {/* Choose Method Step */}
      {currentStep === "choose-method" && (
        <Card>
          <CardHeader>
            <CardTitle>Add Two-Factor Authentication</CardTitle>
            <CardDescription>
              Choose how you want to secure your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-start justify-center"
              onClick={handleEnrollTotp}
              disabled={isLoading}
            >
              <Smartphone className="h-6 w-6 mb-2" />
              <div className="text-left">
                <div className="font-semibold">Authenticator App</div>
                <div className="text-xs text-gray-600">
                  Use Google Authenticator, Authy, or Microsoft Authenticator
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-start justify-center"
              onClick={handleEnrollSms}
              disabled={isLoading}
            >
              <span className="text-xl mb-2">📱</span>
              <div className="text-left">
                <div className="font-semibold">Text Message (SMS)</div>
                <div className="text-xs text-gray-600">
                  Receive verification codes via SMS
                </div>
              </div>
            </Button>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication helps protect your account. We recommend using an authenticator app for better security.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* TOTP Setup Step */}
      {currentStep === "totp-setup" && (
        <Card>
          <CardHeader>
            <CardTitle>Scan QR Code</CardTitle>
            <CardDescription>
              Use your authenticator app to scan this code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {totpUri && (
              <>
                {/* In production, generate actual QR code image from totpUri */}
                <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-center h-48">
                  <div className="text-center text-gray-600">
                    <div className="text-sm mb-2">QR Code would appear here</div>
                    <div className="text-xs text-gray-500">{totpUri.substring(0, 50)}...</div>
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    Can&apos;t scan? Enter this code manually in your authenticator app:
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-100 p-3 rounded font-mono text-sm text-center break-all">
                  {totpUri.split("secret=")[1]?.split("&")[0] || ""}
                </div>

                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium mb-2">
                    Enter verification code from your app:
                  </label>
                  <Input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    className="text-center tracking-widest"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* SMS Setup Step */}
      {currentStep === "sms-setup" && (
        <Card>
          <CardHeader>
            <CardTitle>Verify Your Phone</CardTitle>
            <CardDescription>
              Enter the code sent to your phone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                We&apos;ve sent a verification code to your registered phone number.
              </AlertDescription>
            </Alert>

            <div>
              <label className="block text-sm font-medium mb-2">
                Verification Code
              </label>
              <Input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                className="text-center tracking-widest text-lg"
              />
            </div>

            <p className="text-xs text-gray-600">
              Didn&apos;t receive the code? Check your spam folder or request a new code.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Backup Codes Step */}
      {currentStep === "backup-codes" && backupCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Save Backup Codes</CardTitle>
            <CardDescription>
              Save these codes in a secure location
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Store these codes somewhere safe. You can use them to access your account if you lose access to your authenticator device.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              {backupCodes.map((code, index) => (
                <div key={index} className="flex items-center justify-between font-mono text-sm">
                  <span className="text-gray-600">{code}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyCode(code)}
                  >
                    {copiedCode ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>

            <Button
              className="w-full"
              onClick={() => {
                const text = backupCodes.join("\n");
                navigator.clipboard.writeText(text);
                toast.success("Codes copied to clipboard");
              }}
            >
              Copy All Codes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Complete Step */}
      {currentStep === "complete" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Setup Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Two-factor authentication is now enabled on your account. You&apos;ll be asked to verify your identity on your next login.
              </AlertDescription>
            </Alert>

            <Button className="w-full" onClick={onComplete}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      {currentStep !== "choose-method" && currentStep !== "complete" && (
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setCurrentStep("choose-method")}
          >
            Back
          </Button>
          <Button
            className="flex-1"
            onClick={handleVerifyCode}
            disabled={!verificationCode || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Verify
          </Button>
        </div>
      )}
    </div>
  );
}
