"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { ArrowLeft, Calendar } from "lucide-react"
import PlayerStats from "@/components/player-stats"

export default function PlayerDetailPage({ params }: { params: { id: string } }) {
  const [player, setPlayer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const response = await fetch(`http://localhost:8000/player/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch player")
        }
        const data = await response.json()
        setPlayer(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load player")
      } finally {
        setLoading(false)
      }
    }

    fetchPlayer()
  }, [params.id])

  if (loading) return <div className="text-center py-10">Loading player details...</div>
  if (error) return <div className="text-center py-10 text-red-500">Error loading player: {error}</div>
  if (!player) return <div className="text-center py-10">Player not found</div>

  const isGoalkeeper = player.Position === "Goalkeeper"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/players">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Players
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Player Info</span>
              <Badge variant={isGoalkeeper ? "secondary" : "default"}>
                {isGoalkeeper ? "Goalkeeper" : "Outfield Player"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">{player.Name}</h2>
              <p className="text-muted-foreground">{player.NationalityName}</p>
            </div>

            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground">Club</span>
                <Link href={`/clubs/${player.ClubID}`} className="hover:underline">
                  {player.ClubName}
                </Link>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">League</span>
                <span>{player.LeagueName}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Overall</span>
                <span>{player.Overall}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Value</span>
                <span>€{(player.Value / 1000000).toFixed(1)}M</span>
              </div>
              <div className="flex flex-col col-span-2">
                <span className="text-muted-foreground">Date of Birth</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(player.DOB)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Player Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <PlayerStats player={player} />
          </CardContent>
        </Card>

        {player.Contract && (
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Contract Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Club</span>
                  <Link href={`/clubs/${player.Contract.ClubID}`} className="hover:underline">
                    {player.Contract.ClubName}
                  </Link>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Joined</span>
                  <span>{formatDate(player.Contract.DateOfJoin)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Contract Ends</span>
                  <span>{formatDate(player.Contract.DateOfEnd)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Release Clause</span>
                  <span>€{(player.Contract.ReleaseClause / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
