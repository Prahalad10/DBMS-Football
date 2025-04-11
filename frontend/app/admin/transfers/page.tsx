"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { redirect } from "next/navigation"

export default function TransferMarketPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const { toast } = useToast()

  // Redirect if not admin
  if (!authLoading && !isAdmin) {
    redirect("/login")
  }

  const [minReleaseClause, setMinReleaseClause] = useState<number | undefined>(undefined)
  const [maxReleaseClause, setMaxReleaseClause] = useState<number | undefined>(undefined)
  const [minValue, setMinValue] = useState<number | undefined>(undefined)
  const [maxValue, setMaxValue] = useState<number | undefined>(undefined)

  // Transfer dialog state
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const [newClubId, setNewClubId] = useState<string>("")
  const [releaseClause, setReleaseClause] = useState<string>("")
  const [contractEndDate, setContractEndDate] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [transferMarketItems, setTransferMarketItems] = useState<any[]>([])
  const [clubsData, setClubsData] = useState<any[]>([])

  useEffect(() => {
    const fetchTransferData = async () => {
      try {
        const response = await fetch('http://localhost:8000/transfer-market', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        setTransferMarketItems(data);
      } catch (error) {
        console.error('Error fetching transfer market data:', error);
      }
    };

    const fetchClubsData = async () => {
      try {
        const response = await fetch('http://localhost:8000/clubs', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        setClubsData(data);
      } catch (error) {
        console.error('Error fetching clubs data:', error);
      }
    };

    fetchTransferData();
    fetchClubsData();
  }, [minReleaseClause, maxReleaseClause, minValue, maxValue]);

  const handleTransfer = async () => {
    if (!selectedPlayer || !newClubId || !releaseClause || !contractEndDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/transfer-player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: selectedPlayer.player.PlayerID,
          new_club_id: Number(newClubId),
          release_clause: Number(releaseClause),
          contract_end: contractEndDate,
          contract_start: new Date().toISOString().split('T')[0]
        }),
      });

      if (!response.ok) {
        throw new Error('Transfer failed');
      }

      toast({
        title: "Transfer Completed",
        description: `${selectedPlayer.player.Name} has been transferred successfully.`
      });
      setDialogOpen(false);
      // Refresh data
      const fetchTransferData = async () => {
        try {
          const response = await fetch('http://localhost:8000/transfer-market', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();
          setTransferMarketItems(data);
        } catch (error) {
          console.error('Error fetching transfer market data:', error);
        }
      };
      fetchTransferData();
    } catch (error) {
      toast({
        title: "Transfer Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleOpenTransferDialog = (item: any) => {
    setSelectedPlayer(item)
    setReleaseClause(item.contract.ReleaseClause.toString())

    // Set default contract end date to 3 years from now
    const threeYearsFromNow = new Date()
    threeYearsFromNow.setFullYear(threeYearsFromNow.getFullYear() + 3)
    setContractEndDate(threeYearsFromNow.toISOString().split("T")[0])

    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Transfer Market</h1>
        <p className="text-muted-foreground">Browse available players and manage transfers</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-medium">Release Clause Range (€M)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minReleaseClause !== undefined ? minReleaseClause / 1000000 : ""}
                    onChange={(e) =>
                      setMinReleaseClause(e.target.value ? Number.parseInt(e.target.value) * 1000000 : undefined)
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxReleaseClause !== undefined ? maxReleaseClause / 1000000 : ""}
                    onChange={(e) =>
                      setMaxReleaseClause(e.target.value ? Number.parseInt(e.target.value) * 1000000 : undefined)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-medium">Player Value Range (€M)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minValue !== undefined ? minValue / 1000000 : ""}
                    onChange={(e) =>
                      setMinValue(e.target.value ? Number.parseInt(e.target.value) * 1000000 : undefined)
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxValue !== undefined ? maxValue / 1000000 : ""}
                    onChange={(e) =>
                      setMaxValue(e.target.value ? Number.parseInt(e.target.value) * 1000000 : undefined)
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <Button className="mt-6" onClick={() => {
            const fetchTransferData = async () => {
              try {
                const response = await fetch('http://localhost:8000/transfer-market', {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                });
                const data = await response.json();
                setTransferMarketItems(data);
              } catch (error) {
                console.error('Error fetching transfer market data:', error);
              }
            };
            fetchTransferData();
          }}>
            Apply Filters
          </Button>
        </CardContent>
      </Card>

      {transferMarketItems.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Available Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Player</th>
                    <th className="text-left py-3 px-4">Current Club</th>
                    <th className="text-left py-3 px-4">Nationality</th>
                    <th className="text-right py-3 px-4">Overall</th>
                    <th className="text-right py-3 px-4">Value</th>
                    <th className="text-right py-3 px-4">Release Clause</th>
                    <th className="text-right py-3 px-4">Contract Ends</th>
                    <th className="text-center py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transferMarketItems.map((item: any) => (
                    <tr key={item.player.PlayerID} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{item.player.Name}</td>
                      <td className="py-3 px-4">{item.player.Club.ClubName}</td>
                      <td className="py-3 px-4">{item.player.Nationality.NationalityName}</td>
                      <td className="py-3 px-4 text-right">{item.player.Overall}</td>
                      <td className="py-3 px-4 text-right">€{(item.player.Value / 1000000).toFixed(1)}M</td>
                      <td className="py-3 px-4 text-right">€{(item.contract.ReleaseClause / 1000000).toFixed(1)}M</td>
                      <td className="py-3 px-4 text-right">{formatDate(item.contract.DateOfEnd)}</td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="outline" size="sm" onClick={() => handleOpenTransferDialog(item)}>
                          Transfer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-10 bg-muted rounded-md">No players found matching your criteria</div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Player</DialogTitle>
            <DialogDescription>Complete the transfer details for {selectedPlayer?.player.Name}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">Current Club</label>
              <div className="col-span-3">
                <Input value={selectedPlayer?.player.Club.ClubName} disabled />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">New Club</label>
              <div className="col-span-3">
                <Select value={newClubId} onValueChange={setNewClubId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a club" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubsData
                      .filter((club: any) => club.ClubID !== selectedPlayer?.player.Club.ClubID)
                      .map((club: any) => (
                        <SelectItem key={club.ClubID} value={club.ClubID.toString()}>
                          {club.ClubName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">Release Clause (€M)</label>
              <div className="col-span-3">
                <Input
                  type="number"
                  value={releaseClause ? Number.parseInt(releaseClause) / 1000000 : ""}
                  onChange={(e) =>
                    setReleaseClause(e.target.value ? (Number.parseInt(e.target.value) * 1000000).toString() : "")
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">Contract End Date</label>
              <div className="col-span-3">
                <Input type="date" value={contractEndDate} onChange={(e) => setContractEndDate(e.target.value)} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransfer}>
              Complete Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
