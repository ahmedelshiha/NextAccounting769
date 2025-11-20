'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

/**
 * Portal Entry Point - Redirects to New Dashboard
 * 
 * This page has been retired and all clients are automatically redirected
 * to the new modern dashboard at /portal/dashboard.
 * 
 * The new dashboard includes:
 * - Entity management
 * - Compliance tracking with deadlines
 * - Features hub (KYC, Documents, Invoicing, etc.)
 * - Upcoming compliance items
 * - Quick stats and actions
 */
export default function PortalPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only redirect once auth status is determined
    if (status === 'unauthenticated') {
      // Not logged in - redirect to login
      router.replace('/login');
    } else if (status === 'authenticated') {
      // Logged in - redirect to new dashboard
      router.replace('/portal/dashboard');
    }
    // 'loading' status: wait for auth to complete
  }, [status, router]);

  // Show loading state while auth is being determined
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 dark:text-gray-400">
          Loading your dashboard...
        </p>
      </div>
    </div>
  );
}
