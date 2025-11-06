"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { QrCode, BarChart3, LogOut, CreditCard } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"
import NotificationsDropdown from "./notifications-dropdown"
import Image from "next/image"

export default function Navigation() {
  const { data: session } = useSession()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  // Always render the same structure to avoid hooks issues
  const renderAuthSection = () => {
    if (!isClient) {
      return (
        <div className="flex items-center space-x-2">
          <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
          <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
        </div>
      )
    }

    if (session) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                <AvatarFallback>
                  {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session.user?.name || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session.user?.email || ""}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="flex items-center">
                <BarChart3 className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/pricing" className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Pricing</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="flex items-center">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    return (
      <div className="flex items-center space-x-2">
        <Button variant="ghost" asChild>
          <Link href="/auth/signin">Sign In</Link>
        </Button>
        <Button asChild>
          <Link href="/auth/signup">Sign Up</Link>
        </Button>
      </div>
    )
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex flex-col">
              <Link href="/" className="flex items-center space-x-2">
                <QrCode className="h-6 w-6" />
                <span className="font-bold text-lg">QR Generator</span>
              </Link>
              
              <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground ml-8">
                <span className="text-sm font-medium mr-[2px]">powered by</span>
                {/* Light theme logo */}
                <Image
                  src="/botrix-logo01.png"
                  alt="Botrix AI"
                  width={56}
                  height={56}
                  className="h-6 w-auto block dark:hidden"
                  priority
                />
                {/* Dark & system theme logo */}
                <Image
                  src="/BotrixAI_Dark.jpg"
                  alt="Botrix AI"
                  width={56}
                  height={56}
                  className="h-6 w-auto hidden dark:block"
                  priority
                />
              </div>
            </div>
            
            {session && (
              <div className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Generator
                </Link>
                <Link 
                  href="/dashboard" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/pricing" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pricing
                </Link>
                <Link 
                  href="/test-dynamic" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Test Dynamic QR
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {session && <NotificationsDropdown />}
            <ThemeToggle />
            {renderAuthSection()}
          </div>
        </div>
      </div>
    </nav>
  )
}
