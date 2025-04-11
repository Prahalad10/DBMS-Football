"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Shield } from "lucide-react"

export default function Header() {
  const pathname = usePathname()
  const { user, isAdmin, logout } = useAuth()

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">
            Football Manager
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {user && (
              <>
                <Link
                  href="/players"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname.startsWith("/players") ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Players
                </Link>
                <Link
                  href="/clubs"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname.startsWith("/clubs") ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Clubs
                </Link>
                {isAdmin || JSON.parse(localStorage.user).username === 'admin' && (
                  <Link
                    href="/contracts/create"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname.startsWith("/contracts/create") ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    Create Contract
                  </Link>
                )}
              </>
            )}
            {isAdmin && (
              <Link
                href="/admin/transfers"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname.startsWith("/admin") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-sm leading-none text-muted-foreground">@{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/transfers" className="flex items-center gap-2 cursor-pointer">
                      <Shield className="h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={logout} className="flex items-center gap-2 cursor-pointer">
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button>Login</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline">Register</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
