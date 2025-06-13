import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateRoom } from "@/hooks/use-room";

export default function Home() {
  const [, setLocation] = useLocation();
  const [joinRoomId, setJoinRoomId] = useState("");
  const [moderatorName, setModeratorName] = useState("");
  
  const createRoomMutation = useCreateRoom();

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moderatorName.trim()) return;

    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      await createRoomMutation.mutateAsync({
        id: roomId,
        moderatorId: `mod_${Date.now()}`,
        currentStory: null,
        currentStoryTitle: null,
        isRevealed: false,
      });
      
      // Navigate to room with moderator name
      setLocation(`/room/${roomId}?moderator=${encodeURIComponent(moderatorName)}`);
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomId.trim()) return;
    
    setLocation(`/room/${joinRoomId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2">
                <i className="fas fa-cards-blank text-white text-xl"></i>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Agile Poker</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Agile Poker Planning
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Collaborate with your team to estimate user story points in real-time. 
            Create a room or join an existing session to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Room */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-plus-circle text-blue-600"></i>
                Create New Room
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <Label htmlFor="moderatorName">Your Name (Moderator)</Label>
                  <Input
                    id="moderatorName"
                    type="text"
                    placeholder="Enter your name"
                    value={moderatorName}
                    onChange={(e) => setModeratorName(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createRoomMutation.isPending || !moderatorName.trim()}
                >
                  {createRoomMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Creating Room...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus mr-2"></i>
                      Create Room
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Join Room */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-sign-in-alt text-green-600"></i>
                Join Existing Room
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <Label htmlFor="roomId">Room ID</Label>
                  <Input
                    id="roomId"
                    type="text"
                    placeholder="Enter room ID"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  variant="secondary"
                  disabled={!joinRoomId.trim()}
                >
                  <i className="fas fa-arrow-right mr-2"></i>
                  Join Room
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>


      </main>
    </div>
  );
}
