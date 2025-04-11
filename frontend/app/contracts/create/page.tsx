"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import PlayerCard from "@/components/player-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export default function CreateContractPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Player filtering states
  const [players, setPlayers] = useState([])
  const [nationalities, setNationalities] = useState([])
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: "",
    nationality: "0", // Set default to "All Nationalities"
    club: "0",        // Set default to "All Clubs"
    page: 1,
    pageSize: 12
  })
  
  // Contract states
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [contractDetails, setContractDetails] = useState({
    newClubId: "",
    startDate: new Date(),
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 3)), // 3 years default
    releaseClause: 0
  })

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (user.role === 'admin'|| JSON.parse(localStorage.user).username === 'admin' ) {
        setIsAdmin(true)
      } else {
        router.push("/") // Redirect non-admin users
        toast({
          title: "Access Denied",
          description: "You need admin privileges to access this page",
          variant: "destructive"
        })
      }
    } catch (error) {
      router.push("/")
    }
    
    fetchInitialData()
  }, [router])

  const fetchInitialData = async () => {
    try {
      const [nationalitiesRes, clubsRes] = await Promise.all([
        fetch('http://localhost:8000/all-nationalities'),
        fetch('http://localhost:8000/all-clubs')
      ])

      const [nationalitiesData, clubsData] = await Promise.all([
        nationalitiesRes.json(),
        clubsRes.json()
      ])

      setNationalities(nationalitiesData)
      setClubs(clubsData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching initial data:', error)
      toast({
        title: "Error",
        description: "Failed to load initial data",
        variant: "destructive"
      })
    }
  }

  // Updated to match players page logic
  const fetchPlayers = async () => {
    setLoading(true);
    try {
      // Fetch both outfield players and goalkeepers like in players page
      const [outfieldResponse, goalkeepersResponse] = await Promise.all([
        fetch('http://localhost:8000/player_route', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            starts_with: filters.search,
            nationality: filters.nationality || '0',
            club: filters.club || '0',
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
            nationality: filters.nationality || '0',
            club: filters.club || '0',
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
    } catch (error) {
      console.error('Error fetching players:', error);
      toast({
        title: "Error",
        description: "Failed to fetch players",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault()
    fetchPlayers()
  }

  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player)
    // Reset contract club selection if player already belongs to that club
    if (contractDetails.newClubId === player.Club?.ClubID?.toString()) {
      setContractDetails({...contractDetails, newClubId: ""})
    }
  }

  const handleContractSubmit = async (e) => {
    e.preventDefault()
    if (!selectedPlayer) {
      toast({
        title: "Error",
        description: "Please select a player",
        variant: "destructive"
      })
      return
    }
    
    if (!contractDetails.newClubId) {
      toast({
        title: "Error",
        description: "Please select a new club",
        variant: "destructive"
      })
      return
    }
    
    try {
      const response = await fetch('http://localhost:8000/transfer-player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: selectedPlayer.PlayerID,
          new_club_id: parseInt(contractDetails.newClubId),
          contract_start: format(contractDetails.startDate, 'yyyy-MM-dd'),
          contract_end: format(contractDetails.endDate, 'yyyy-MM-dd'),
          release_clause: contractDetails.releaseClause
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create contract')
      }
      
      toast({
        title: "Success",
        description: "Player transfer completed and contract created",
      })
      
      // Reset form and fetch updated player list
      setSelectedPlayer(null)
      setContractDetails({
        newClubId: "",
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 3)),
        releaseClause: 0
      })
      fetchPlayers()
    } catch (error) {
      console.error('Error creating contract:', error)
      toast({
        title: "Error",
        description: "Failed to create contract",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchPlayers()
    }
  }, [filters.nationality, filters.club, isAdmin])

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Player Contract</h1>
        <p className="text-muted-foreground">Search for a player, select them, and create a new contract</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Player Search */}
        <div className="md:col-span-2 space-y-6">
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
                    {nationalities.map((nationality) => (
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
                    {clubs.map((club) => (
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

          {loading ? (
            <div className="text-center py-10">Loading players...</div>
          ) : players.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {players.map((player) => (
                <div 
                  key={player.PlayerID} 
                  className={`cursor-pointer transition-all ${selectedPlayer?.PlayerID === player.PlayerID ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => handlePlayerSelect(player)}
                >
                  <PlayerCard player={player} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">No players found matching your criteria</div>
          )}
        </div>

        {/* Right Column - Contract Creation */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Create Contract</h2>
              
              {selectedPlayer ? (
                <div className="mb-4 p-3 bg-muted rounded-md">
                  <p className="font-medium">{selectedPlayer.Name}</p>
                  <p className="text-sm text-muted-foreground">
                    Current Club: {selectedPlayer.Club?.ClubName || 'None'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Nationality: {selectedPlayer.Nationality?.NationalityName}
                  </p>
                </div>
              ) : (
                <p className="mb-4 text-muted-foreground">Select a player from the list</p>
              )}
              
              <form onSubmit={handleContractSubmit} className="space-y-4">
                <div>
                  <label htmlFor="newClub" className="block text-sm font-medium mb-1">
                    New Club
                  </label>
                  <Select 
                    value={contractDetails.newClubId} 
                    onValueChange={(value) => setContractDetails({...contractDetails, newClubId: value})}
                    disabled={!selectedPlayer}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select new club" />
                    </SelectTrigger>
                    <SelectContent>
                      {clubs.map((club) => (
                        <SelectItem 
                          key={club.ClubID} 
                          value={club.ClubID.toString()}
                          disabled={selectedPlayer && club.ClubID.toString() === selectedPlayer.Club?.ClubID?.toString()}
                        >
                          {club.ClubName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Contract Start Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !contractDetails.startDate && "text-muted-foreground"
                        )}
                        disabled={!selectedPlayer}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {contractDetails.startDate ? format(contractDetails.startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={contractDetails.startDate}
                        onSelect={(date) => setContractDetails({...contractDetails, startDate: date})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Contract End Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !contractDetails.endDate && "text-muted-foreground"
                        )}
                        disabled={!selectedPlayer}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {contractDetails.endDate ? format(contractDetails.endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={contractDetails.endDate}
                        onSelect={(date) => setContractDetails({...contractDetails, endDate: date})}
                        initialFocus
                        disabled={(date) => date < contractDetails.startDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <label htmlFor="releaseClause" className="block text-sm font-medium mb-1">
                    Release Clause (€)
                  </label>
                  <Input
                    id="releaseClause"
                    type="number"
                    min="0"
                    value={contractDetails.releaseClause}
                    onChange={(e) => setContractDetails({...contractDetails, releaseClause: parseInt(e.target.value) || 0})}
                    disabled={!selectedPlayer}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!selectedPlayer || !contractDetails.newClubId}
                >
                  Create Contract
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
