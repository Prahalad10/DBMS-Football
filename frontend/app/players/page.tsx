"use client"

import { useEffect, useState } from "react"
import type React from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PlayerCard from "@/components/player-card"
import { Search } from "lucide-react"

export default function PlayersPage() {
  const [players, setPlayers] = useState([])
  const [nationalities, setNationalities] = useState([])
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: "",
    nationality: "",
    club: "",
    minOverall: "",
    maxOverall: "",
    position: "",
    page: 1,
    pageSize: 12
  })

  const fetchPlayers = async (activeTab = 'all') => {
    setLoading(true);
    try {
      if (activeTab === 'all') {
        // Fetch both outfield players and goalkeepers
        const [outfieldResponse, goalkeepersResponse] = await Promise.all([
          fetch('http://localhost:8000/player_route', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              starts_with: filters.search,
              nationality: filters.nationality || 'any',
              club: filters.club || 'any',
              outfield_players: true,
              goal_keepers: false
            }),
          }),
          fetch('http://localhost:8000/goalkeeper_route', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              starts_with: filters.search,
              nationality: filters.nationality || 'any',
              club: filters.club || 'any',
              outfield_players: false,
              goal_keepers: true
            }),
          })
        ]);
        
        const [outfieldData, goalkeepersData] = await Promise.all([
          outfieldResponse.ok ? outfieldResponse.json() : [],
          goalkeepersResponse.ok ? goalkeepersResponse.json() : []
        ]);
        
        // Combine the results
        setPlayers([...outfieldData, ...goalkeepersData]);
      } else if (activeTab === 'outfield') {
        // Fetch only outfield players
        const response = await fetch('http://localhost:8000/player_route', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            starts_with: filters.search,
            nationality: filters.nationality || 'any',
            club: filters.club || 'any',
            outfield_players: true,
            goal_keepers: false
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch outfield players');
        }
        
        const data = await response.json();
        setPlayers(data);
      } else if (activeTab === 'goalkeepers') {
        // Fetch only goalkeepers
        const response = await fetch('http://localhost:8000/goalkeeper_route', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            starts_with: filters.search,
            nationality: filters.nationality || 'any',
            club: filters.club || 'any',
            outfield_players: false,
            goal_keepers: true
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch goalkeepers');
        }
        
        const data = await response.json();
        setPlayers(data);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [nationalitiesRes, clubsRes] = await Promise.all([
          fetch('http://localhost:8000/all-nationalities'),
          fetch('http://localhost:8000/all-clubs')
        ]);

        const [nationalitiesData, clubsData] = await Promise.all([
          nationalitiesRes.json(),
          clubsRes.json()
        ]);

        setNationalities(nationalitiesData);
        setClubs(clubsData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlayers();
  };

  const handleTabChange = (value: string) => {
    fetchPlayers(value);
  };

  const outfieldPlayers = players.filter(player => player.Position === "Outfield");
  const goalkeepers = players.filter(player => player.Position === "Goalkeeper");
  const allPlayers = [...outfieldPlayers, ...goalkeepers];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Player Directory</h1>
        <p className="text-muted-foreground">Browse and search for players by name, nationality, or club</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search players..."
                className="pl-8"
                value={filters.search}
                onChange={(e) => setFilters((prevFilters) => ({ ...prevFilters, search: e.target.value }))}
              />
            </div>

            <Select value={filters.nationality} onValueChange={(value) => setFilters((prevFilters) => ({ ...prevFilters, nationality: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Nationality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Nationalities</SelectItem>
                {nationalities.map((nationality: any) => (
                  <SelectItem 
                    key={nationality.NationalityID} 
                    value={nationality.NationalityID.toString()}
                  >
                    {nationality.NationalityName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.club} onValueChange={(value) => setFilters((prevFilters) => ({ ...prevFilters, club: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Club" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Clubs</SelectItem>
                {clubs.map((club: any) => (
                  <SelectItem 
                    key={club.ClubID} 
                    value={club.ClubID.toString()}
                  >
                    {club.ClubName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit">Apply Filters</Button>
          </form>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="all">All Players</TabsTrigger>
          <TabsTrigger value="outfield">Outfield Players</TabsTrigger>
          <TabsTrigger value="goalkeepers">Goalkeepers</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {loading ? (
            <div className="text-center py-10">Loading players...</div>
          ) : allPlayers.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {allPlayers.map((player) => (
                <PlayerCard key={player.PlayerID} player={player} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">No players found matching your criteria</div>
          )}
        </TabsContent>

        <TabsContent value="outfield" className="mt-0">
          {loading ? (
            <div className="text-center py-10">Loading players...</div>
          ) : outfieldPlayers.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {outfieldPlayers.map((player) => (
                <PlayerCard key={player.PlayerID} player={player} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">No outfield players found matching your criteria</div>
          )}
        </TabsContent>

        <TabsContent value="goalkeepers" className="mt-0">
          {loading ? (
            <div className="text-center py-10">Loading players...</div>
          ) : goalkeepers.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {goalkeepers.map((player) => (
                <PlayerCard key={player.PlayerID} player={player} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">No goalkeepers found matching your criteria</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
