import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

type PlayerCardProps = {
  player: any
}

export default function PlayerCard({ player }: PlayerCardProps) {
  const isGoalkeeper = player.Position === "Goalkeeper"

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg">{player.Name || 'Unknown'}</h3>
            <p className="text-sm text-muted-foreground">
              {player.Nationality?.NationalityName || 'Unknown Nationality'}
            </p>
          </div>
          <Badge variant={isGoalkeeper ? "secondary" : "default"}>
            {isGoalkeeper ? "GK" : "Player"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Club</span>
            <span>{player.Club?.ClubName || 'Unknown Club'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">League</span>
            <span>{player.Club?.LeagueName || 'Unknown League'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Overall</span>
            <span>{player.Overall || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Value</span>
            <span>€{((player.Value || 0) / 1000000).toFixed(1)}M</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">DOB</span>
            <span>{player.DOB ? formatDate(player.DOB) : 'Unknown'}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/players/${player.PlayerID}`} className="w-full">
          <Button variant="outline" className="w-full">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
