"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"
import { saveE2ETestSession } from "@/lib/e2e-test-session"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()
  const isClientTestMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === "true"

  // Clear form fields on component mount to prevent auto-fill
  useEffect(() => {
    setName("")
    setEmail("")
    setPassword("")
    setConfirmPassword("")
  }, [])

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      await signIn("google", { callbackUrl: "/dashboard" })
    } catch {
      toast.error("Failed to sign up with Google. Please try again.")
      setIsGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    try {
      if (isClientTestMode) {
        const plan = email.includes("test-user-1") ? "PRO" : "FREE"
        saveE2ETestSession({
          id: `test-${email}`,
          email,
          name: name || email.split("@")[0] || "E2E User",
          plan: plan as "FREE" | "PRO",
        })
        toast.success("Account created successfully! (test mode)")
        router.push("/dashboard")
        return
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      if (response.ok) {
        toast.success("Account created successfully!")
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.ok) {
          toast.success("Welcome! You're now signed in.")
          router.push("/dashboard")
        } else {
          toast.info("Account created. Please sign in.")
          router.push("/auth/signin")
        }
      } else {
        const data = await response.json()
        toast.error(data.error || "Registration failed. Please try again.")
      }
    } catch {
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">Sign Up</CardTitle>
          <CardDescription className="text-center text-gray-600 dark:text-gray-300">
            Create an account to start generating QR codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Google Sign Up */}
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center gap-3 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-gray-700" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {isGoogleLoading ? "Redirecting to Google..." : "Continue with Google"}
            </span>
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-400 dark:text-gray-500">
                or create with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <input type="text" style={{ display: "none" }} autoComplete="username" />
            <input type="password" style={{ display: "none" }} autoComplete="current-password" />
            <div className="space-y-2">
              <Label htmlFor="signup-name" className="text-gray-700">Name</Label>
              <Input
                id="signup-name"
                name="signup-name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-gray-700">Email</Label>
              <Input
                id="signup-email"
                name="signup-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password" className="text-gray-700">Password</Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  name="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-confirm-password" className="text-gray-700">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="signup-confirm-password"
                  name="signup-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-gray-900 font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
