"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Shield, Users, Building } from "lucide-react"
import { useAuth } from "@/lib/auth-provider"

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4 py-10">
        <h1 className="text-4xl font-bold">Football Manager System</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Manage players, clubs, and transfers in one comprehensive platform
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {user ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Player Directory
                </CardTitle>
                <CardDescription>Browse and search for players by name, nationality, or club</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/players">
                  <Button className="w-full">View Players</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Club Dashboard
                </CardTitle>
                <CardDescription>View club details with player rosters and contract information</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/clubs">
                  <Button className="w-full">View Clubs</Button>
                </Link>
              </CardContent>
            </Card>

            {user.role === "admin" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Admin Panel
                  </CardTitle>
                  <CardDescription>Access admin features including the transfer market simulator</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/transfers">
                    <Button className="w-full">Admin Access</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Welcome to Football Manager System</CardTitle>
              <CardDescription>Please log in to access the system features</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login">
                <Button className="w-full">Login</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
