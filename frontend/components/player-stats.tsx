import { Progress } from "@/components/ui/progress"

type PlayerStatsProps = {
  player: any
}

export default function PlayerStats({ player }: PlayerStatsProps) {
  const isGoalkeeper = "Reflexes" in player

  if (isGoalkeeper) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatItem label="Reflexes" value={player.Reflexes} />
        <StatItem label="Diving" value={player.Diving} />
        <StatItem label="Handling" value={player.Handling} />
        <StatItem label="Positioning" value={player.Positioning} />
        <StatItem label="Speed" value={player.Speed} />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <StatItem label="Pace" value={player.Pace} />
      <StatItem label="Shooting" value={player.Shooting} />
      <StatItem label="Passing" value={player.Passing} />
      <StatItem label="Dribbling" value={player.Dribbling} />
      <StatItem label="Defending" value={player.Defending} />
      <StatItem label="Physical" value={player.Physical} />
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  )
}
