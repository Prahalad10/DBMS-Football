"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, Building } from "lucide-react"

export default function ClubsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNationality, setSelectedNationality] = useState<string>("")
  const [clubs, setClubs] = useState<any[]>([])
  const [nationalities, setNationalities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clubsRes, nationalitiesRes] = await Promise.all([
          fetch('http://localhost:8000/all-clubs'),
          fetch('http://localhost:8000/all-nationalities')
        ]);

        const [clubsData, nationalitiesData] = await Promise.all([
          clubsRes.json(),
          nationalitiesRes.json()
        ]);

        setClubs(clubsData);
        setNationalities(nationalitiesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredClubs = clubs.filter((club) => {
    const matchesSearch =
      searchTerm === "" ||
      club.ClubName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.LeagueName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesNationality =
      selectedNationality === "" || club.NationalityID.toString() === selectedNationality

    return matchesSearch && matchesNationality
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Club Directory</h1>
        <p className="text-muted-foreground">Browse and search for clubs by name, league, or nationality</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search clubs or leagues..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={selectedNationality} onValueChange={setSelectedNationality}>
              <SelectTrigger>
                <SelectValue placeholder="Nationality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Nationalities</SelectItem>
                {nationalities.map((nationality: any) => (
                  <SelectItem key={nationality.NationalityID} value={nationality.NationalityID.toString()}>
                    {nationality.NationalityName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-10">Loading clubs...</div>
      ) : filteredClubs.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClubs.map((club: any) => (
            <Card key={club.ClubID}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {club.ClubName}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">League</span>
                    <span>{club.LeagueName}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Nationality</span>
                    <span>{club.NationalityName}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/clubs/${club.ClubID}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    View Club
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">No clubs found matching your criteria</div>
      )}
    </div>
  )
}
