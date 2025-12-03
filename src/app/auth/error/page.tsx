"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react"

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Server Configuration Error",
    description: "There is a problem with the server configuration. Please contact support.",
  },
  AccessDenied: {
    title: "Access Denied",
    description: "You do not have permission to access this resource.",
  },
  Verification: {
    title: "Verification Required",
    description: "Please verify your email address before signing in.",
  },
  OAuthSignin: {
    title: "OAuth Sign In Error",
    description: "Error connecting to authentication provider. Please try again.",
  },
  OAuthCallback: {
    title: "OAuth Callback Error",
    description: "Error during OAuth callback. Please try signing in again.",
  },
  OAuthCreateAccount: {
    title: "Account Creation Error",
    description: "Could not create OAuth account. Please try again or contact support.",
  },
  EmailCreateAccount: {
    title: "Email Account Error",
    description: "Could not create email account. Please try again.",
  },
  Callback: {
    title: "Callback Error",
    description: "Error during authentication callback. Please try again.",
  },
  OAuthAccountNotLinked: {
    title: "Account Not Linked",
    description: "This email is already associated with another account. Please sign in with your original method.",
  },
  EmailSignin: {
    title: "Email Sign In Error",
    description: "Check your email address or try signing in with a different method.",
  },
  CredentialsSignin: {
    title: "Invalid Credentials",
    description: "The email or password you entered is incorrect. Please try again.",
  },
  SessionRequired: {
    title: "Session Required",
    description: "Please sign in to access this page.",
  },
  Default: {
    title: "Authentication Error",
    description: "An error occurred during authentication. Please try again.",
  },
  TokenExpired: {
    title: "Session Expired",
    description: "Your session has expired. Please sign in again to continue.",
  },
  AccountDeactivated: {
    title: "Account Deactivated",
    description: "Your account has been deactivated. Please contact support for assistance.",
  },
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const errorInfo = error && error in errorMessages 
    ? errorMessages[error] 
    : errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950 px-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error details */}
          {error && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Error code: <span className="font-mono font-semibold">{error}</span>
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3 pt-4">
            <Button asChild className="w-full" size="lg">
              <Link href="/auth/signin">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Signing In Again
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full" size="lg">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>

          {/* Help text */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              Need help?{" "}
              <Link 
                href="/contact" 
                className="text-primary hover:underline font-medium"
              >
                Contact Support
              </Link>
            </p>
          </div>

          {/* Additional tips for specific errors */}
          {error === "CredentialsSignin" && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Tip:</strong> Make sure Caps Lock is off and check your email for typos.
              </p>
            </div>
          )}

          {error === "TokenExpired" && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> For security, sessions expire after 30 days of inactivity.
              </p>
            </div>
          )}

          {error === "OAuthAccountNotLinked" && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Each email can only be associated with one authentication method. 
                Please sign in using your original method (email/password or OAuth provider).
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

