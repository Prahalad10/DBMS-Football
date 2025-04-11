"use client"

import { useEffect, useState } from "react"

export default function HomePage() {
  const [players, setPlayers] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/all-players')
        if (!response.ok) {
          throw new Error('Failed to fetch players')
        }
        const data = await response.json()
        setPlayers(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (error) return <p>Error: {error}</p>
  if (loading) return <p>Loading...</p>

  return (
    <div>
      <h1>Player Stats</h1>
      <ul>
        {players.map((player) => (
          <li key={player.PlayerID}>
            {player.Name} - Overall: {player.Overall}
          </li>
        ))}
      </ul>
    </div>
  )
}
