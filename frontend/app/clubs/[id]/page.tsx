"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Building, Users } from "lucide-react"
import PlayerCard from "@/components/player-card"

export default function ClubDetailPage({ params }: { params: { id: string } }) {
  const [club, setClub] = useState<any>(null)
  const [goalkeepers, setGoalkeepers] = useState<any[]>([])
  const [outfieldPlayers, setOutfieldPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClub = async () => {
      try {
        const res = await fetch(`http://localhost:8000/clubs/${params.id}`)
        const data = await res.json()

        // Filter players by position
        const goalkeepers = data.players.filter((player: any) => player.Position === "Goalkeeper")
        const outfieldPlayers = data.players.filter((player: any) => player.Position === "Outfield")

        setClub(data)
        setGoalkeepers(goalkeepers)
        setOutfieldPlayers(outfieldPlayers)
      } catch (error) {
        console.error("Failed to fetch club:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchClub()
  }, [params.id])

  if (loading) return <div>Loading...</div>
  if (!club) return <div>Club not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/clubs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clubs
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Building className="h-6 w-6" />
            {club.ClubName}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <span className="text-muted-foreground">League</span>
            <span className="font-medium">{club.LeagueName}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Nationality</span>
            <span className="font-medium">{club.Nationality.NationalityName}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Squad Size</span>
            <span className="font-medium">{club.players.length} Players</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="squad">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="goalkeepers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Goalkeepers
          </TabsTrigger>
          <TabsTrigger value="outfield" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Outfield Players
          </TabsTrigger>
        </TabsList>

        <TabsContent value="goalkeepers" className="mt-0 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Goalkeepers ({goalkeepers.length})</h3>
            {goalkeepers.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {goalkeepers.map((player: any) => (
                  <PlayerCard key={player.PlayerID} player={player} />
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-muted rounded-md">No goalkeepers in the squad</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="outfield" className="mt-0 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Outfield Players ({outfieldPlayers.length})</h3>
            {outfieldPlayers.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {outfieldPlayers.map((player: any) => (
                  <PlayerCard key={player.PlayerID} player={player} />
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-muted rounded-md">No outfield players in the squad</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
