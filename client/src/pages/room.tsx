import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VotingCard } from "@/components/voting-card";
import { ParticipantsList } from "@/components/participants-list";
import { ScoreRevealModal } from "@/components/score-reveal-modal";
import { JiraSyncModal } from "@/components/jira-sync-modal";
import { JiraConfigModal } from "@/components/jira-config-modal";
import { 
  useRoom, 
  useJoinRoom, 
  useSubmitVote, 
  useUpdateRoom, 
  useStartNewRound, 
  useSyncToJira,
  useResults 
} from "@/hooks/use-room";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const FIBONACCI_VALUES = [
  { value: "0", suit: "♠" },
  { value: "0.5", suit: "♥" },
  { value: "1", suit: "♦" },
  { value: "2", suit: "♣" },
  { value: "3", suit: "♠" },
  { value: "5", suit: "♥" },
  { value: "8", suit: "♦" },
  { value: "13", suit: "♣" },
];

const SPECIAL_CARDS = [
  { value: "pass", display: "Pass", suit: "☕" },
  { value: "infinity", display: "∞", suit: "?" },
];

export default function Room() {
  const { roomId } = useParams();
  const [, setLocation] = useLocation();
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const queryClient = useQueryClient();
  
  const [participantName, setParticipantName] = useState("");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [storyInput, setStoryInput] = useState("");
  const [storyTitleInput, setStoryTitleInput] = useState("");
  const [showJoinDialog, setShowJoinDialog] = useState(true);
  const [showScoreReveal, setShowScoreReveal] = useState(false);
  const [showJiraSync, setShowJiraSync] = useState(false);
  const [showJiraConfig, setShowJiraConfig] = useState(false);
  const [syncedScore, setSyncedScore] = useState<number | undefined>(undefined);
  const [currentRound] = useState(1);
  
  const { toast } = useToast();
  
  const { data: room, isLoading, error } = useRoom(roomId || null);
  const { data: results } = useResults(roomId || null, currentRound, showScoreReveal || !!room?.isRevealed);
  const joinRoomMutation = useJoinRoom();
  const submitVoteMutation = useSubmitVote();
  const updateRoomMutation = useUpdateRoom();
  const startNewRoundMutation = useStartNewRound();
  const syncToJiraMutation = useSyncToJira();

  // Auto-join as moderator if coming from create room flow
  useEffect(() => {
    const moderatorName = searchParams.get('moderator');
    if (moderatorName && room && !participantId) {
      setParticipantName(moderatorName);
      handleJoinRoom(moderatorName, true);
    }
  }, [room, participantId, searchParams]);

  const handleJoinRoom = async (name: string, isModerator: boolean = false) => {
    if (!roomId || !name.trim()) return;

    try {
      const participant = await joinRoomMutation.mutateAsync({
        roomId,
        participant: {
          name: name.trim(),
          isModerator,
          isActive: true,
        },
      });
      
      setParticipantId(participant.id);
      setShowJoinDialog(false);
    } catch (error) {
      console.error("Failed to join room:", error);
    }
  };

  const handleVoteSubmit = async (value: string) => {
    if (!roomId || !participantId) return;

    // If clicking the same card, deselect it
    if (displaySelectedVote === value) {
      // Clear the vote by submitting empty value
      try {
        await submitVoteMutation.mutateAsync({
          roomId,
          vote: {
            participantId,
            value: "", // Empty value means no vote
            round: currentRound,
          },
        });
        
        setSelectedVote(null);
      } catch (error) {
        console.error("Failed to clear vote:", error);
      }
      return;
    }

    try {
      await submitVoteMutation.mutateAsync({
        roomId,
        vote: {
          participantId,
          value,
          round: currentRound,
        },
      });
      
      setSelectedVote(value);
    } catch (error) {
      console.error("Failed to submit vote:", error);
    }
  };

  const handleUpdateStory = async () => {
    if (!roomId || !storyInput.trim()) return;

    try {
      await updateRoomMutation.mutateAsync({
        roomId,
        updates: {
          currentStory: storyInput.trim(),
          currentStoryTitle: storyTitleInput.trim() || null,
          isRevealed: false,
        },
      });
      
      setStoryInput("");
      setStoryTitleInput("");
    } catch (error) {
      console.error("Failed to update story:", error);
    }
  };

  const handleRevealScores = async () => {
    if (!roomId) return;

    try {
      await updateRoomMutation.mutateAsync({
        roomId,
        updates: { isRevealed: true },
      });
      
      // Force refetch results before showing modal
      await queryClient.invalidateQueries({ queryKey: ["/api/results", roomId] });
      setShowScoreReveal(true);
    } catch (error) {
      console.error("Failed to reveal scores:", error);
    }
  };

  const handleNewRound = async () => {
    if (!roomId) return;

    try {
      await startNewRoundMutation.mutateAsync({ roomId, round: currentRound });
      // Reset current story when starting new round
      await updateRoomMutation.mutateAsync({
        roomId,
        updates: {
          currentStory: null,
          currentStoryTitle: null,
          isRevealed: false,
        },
      });
      setSelectedVote(null);
      setShowScoreReveal(false);
      setStoryInput("");
      setStoryTitleInput("");
    } catch (error) {
      console.error("Failed to start new round:", error);
    }
  };

  // Reset selected vote when room is revealed or new round starts
  useEffect(() => {
    if (!room?.isRevealed) {
      setSelectedVote(null);
    }
  }, [room?.isRevealed, currentRound]);

  // Handle participant cleanup only on actual page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (roomId && participantId && participantName) {
        // Save state for potential refresh
        sessionStorage.setItem('pageRefreshed', 'true');
        sessionStorage.setItem('participantName', participantName);
        if (room) {
          const currentParticipant = room.participants.find(p => p.id === participantId);
          sessionStorage.setItem('isModerator', (currentParticipant?.isModerator || false).toString());
        }
        
        // Clean up participant on actual page unload
        fetch(`/api/rooms/${roomId}/participants/${participantId}`, {
          method: 'DELETE',
          keepalive: true,
        }).catch(() => {
          // Ignore errors during cleanup
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomId, participantId, participantName, room]);

  // Simple refresh handling without aggressive deletion
  useEffect(() => {
    const wasRefreshed = sessionStorage.getItem('pageRefreshed');
    
    if (wasRefreshed && roomId && !participantId) {
      const savedParticipantName = sessionStorage.getItem('participantName');
      const savedIsModerator = sessionStorage.getItem('isModerator') === 'true';
      
      if (savedParticipantName) {
        handleJoinRoom(savedParticipantName, savedIsModerator);
        sessionStorage.removeItem('pageRefreshed');
        sessionStorage.removeItem('participantName');
        sessionStorage.removeItem('isModerator');
      }
    }
  }, [roomId, participantId]);

  const handleSyncToJira = async (fieldId?: string, customScore?: number) => {
    if (!roomId || !room?.currentStory || !results) return;

    const finalScore = customScore !== undefined ? customScore : results.average;

    try {
      await syncToJiraMutation.mutateAsync({
        roomId,
        storyId: room.currentStory,
        averagePoints: finalScore,
        fieldId,
      });
      
      setSyncedScore(finalScore);
      setShowJiraSync(true);
    } catch (error) {
      console.error("Failed to sync to Jira:", error);
    }
  };

  const handleOpenJiraConfig = () => {
    setShowJiraConfig(true);
  };

  const copyRoomLink = async () => {
    const url = `${window.location.origin}/room/${roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Room link copied to clipboard!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Loading room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Room Not Found</h2>
            <p className="text-gray-600 mb-4">The room you're looking for doesn't exist or has expired.</p>
            <Button className="w-full" onClick={() => setLocation("/")}>
              <i className="fas fa-home mr-2"></i>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!room) return null;

  const currentParticipant = room.participants.find(p => p.id === participantId);
  const isModerator = currentParticipant?.isModerator || false;
  const activeParticipants = room.participants.filter(p => p.isActive);
  const nonModeratorParticipants = activeParticipants.filter(p => !p.isModerator);
  const votedCount = room.votes.filter(v => v.round === currentRound).length;
  const nonModeratorVotes = room.votes.filter(v => {
    const participant = activeParticipants.find(p => p.id === v.participantId);
    return v.round === currentRound && participant && !participant.isModerator && v.value !== "";
  });
  const canRevealScores = nonModeratorParticipants.length > 0; // Can reveal even if not all voted
  
  // Show results to all participants when moderator reveals scores
  const shouldShowResults = room.isRevealed || showScoreReveal;

  // Get current participant's vote
  const currentVote = room.votes.find(v => v.participantId === participantId && v.round === currentRound);
  const displaySelectedVote = currentVote?.value || selectedVote;

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
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Room: {roomId}</span>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
                <i className="fas fa-home"></i>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Share Room Link (Compact) */}
        {isModerator && (
          <div className="mb-4 text-center">
            <div className="inline-flex items-center space-x-2 text-xs text-gray-500">
              <i className="fas fa-link"></i>
              <code className="bg-gray-100 px-2 py-1 rounded">
                {window.location.origin}/room/{roomId}
              </code>
              <Button variant="ghost" size="sm" onClick={copyRoomLink} className="h-6 w-6 p-0">
                <i className="fas fa-copy text-xs"></i>
              </Button>
            </div>
          </div>
        )}

        {/* PC/Laptop Layout: 20% | 50% | 30% */}
        <div className="flex gap-4 h-full">
          {/* Left Section - 20% Story Management */}
          <div className="w-[20%] hidden lg:block">
            {/* Story Management (Top Priority) */}
            {isModerator && (
              <Card className="bg-gradient-to-br from-orange-50 to-yellow-100 border-orange-200 mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-sm">
                    <i className="fas fa-edit mr-2 text-orange-600"></i>
                    Story Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <Input
                      type="text"
                      placeholder="Story ID"
                      value={storyInput}
                      onChange={(e) => setStoryInput(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      type="text"
                      placeholder="Story Title"
                      value={storyTitleInput}
                      onChange={(e) => setStoryTitleInput(e.target.value)}
                      className="text-sm"
                    />
                    <Button 
                      onClick={handleUpdateStory}
                      disabled={!storyInput.trim() || updateRoomMutation.isPending}
                      className="w-full text-sm bg-orange-600 hover:bg-orange-700"
                    >
                      <i className="fas fa-save mr-2"></i>
                      Update Story
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Story Display */}
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm">
                  <i className="fas fa-book mr-2 text-purple-600"></i>
                  Current Story
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {room.currentStory ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <div className="text-sm font-medium text-purple-800 mb-1">Story ID</div>
                      <div className="text-lg font-bold text-purple-900 break-words">{room.currentStory}</div>
                    </div>
                    {room.currentStoryTitle && (
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        <div className="text-sm font-medium text-purple-800 mb-1">Title</div>
                        <div className="text-sm text-gray-700 break-words">{room.currentStoryTitle}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-4 text-gray-500">
                    <i className="fas fa-clipboard-list text-2xl mb-2 block"></i>
                    <p className="text-sm">No story set</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Center Section - 50% Voting Cards */}
          <div className="w-full lg:w-[50%] order-1">

            {/* MAIN VOTING CARDS - CENTRAL FOCUS */}
            <Card className="mb-8 border-2 border-blue-200 shadow-xl bg-gradient-to-br from-blue-50/50 to-indigo-100/50">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-3xl font-bold text-gray-900 mb-2">Select Your Estimate</CardTitle>
                <p className="text-lg text-gray-600">Choose a card to cast your vote</p>
              </CardHeader>
              <CardContent className="px-8 pb-12">
                {/* Fibonacci Cards - Large and Prominent */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 mb-12 justify-items-center">
                  {FIBONACCI_VALUES.map((card) => (
                    <VotingCard
                      key={card.value}
                      value={card.value}
                      suit={card.suit}
                      isSelected={displaySelectedVote === card.value}
                      onClick={() => handleVoteSubmit(card.value)}
                      className="w-20 h-28 sm:w-24 sm:h-32 md:w-28 md:h-36 text-xl sm:text-2xl font-bold transform hover:scale-110 transition-all duration-200 shadow-lg hover:shadow-2xl"
                    />
                  ))}
                </div>
                
                {/* Special Cards - Also Enlarged */}
                <div className="flex gap-6 justify-center">
                  {SPECIAL_CARDS.map((card) => (
                    <VotingCard
                      key={card.value}
                      value={card.value}
                      displayValue={card.display}
                      suit={card.suit}
                      isSelected={displaySelectedVote === card.value}
                      onClick={() => handleVoteSubmit(card.value)}
                      className="w-24 h-32 sm:w-28 sm:h-36 text-lg sm:text-xl font-bold transform hover:scale-110 transition-all duration-200 shadow-lg hover:shadow-2xl"
                    />
                  ))}
                </div>
                
                {/* Vote Status Indicator */}
                <div className="mt-8 text-center">
                  {displaySelectedVote ? (
                    <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                      <i className="fas fa-check-circle"></i>
                      <span className="font-medium">Your vote: {displaySelectedVote}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleVoteSubmit("")}
                        className="text-green-600 hover:text-green-800 ml-2 h-6 w-6 p-0"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </Button>
                    </div>
                  ) : (
                    <div className="inline-flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">
                      <i className="fas fa-clock"></i>
                      <span className="font-medium">Waiting for your vote...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Section - 30% Participants & Controls */}
          <div className="w-full lg:w-[30%] order-2 space-y-4">
            {/* Moderator Controls */}
            {isModerator && (
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-sm">
                    <i className="fas fa-crown mr-2 text-blue-600"></i>
                    Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-center p-2 bg-white rounded-lg shadow-sm">
                      <div className="text-lg font-bold text-blue-600 mb-1">
                        {nonModeratorVotes.length}/{nonModeratorParticipants.length}
                      </div>
                      <div className="text-xs text-gray-500">Voted</div>
                    </div>
                    
                    <div className="space-y-2">
                      <Button
                        onClick={handleRevealScores}
                        disabled={!canRevealScores || updateRoomMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700 text-sm h-9"
                      >
                        <i className="fas fa-eye mr-2"></i>
                        Reveal Scores
                      </Button>
                      <Button
                        onClick={handleNewRound}
                        disabled={startNewRoundMutation.isPending}
                        variant="outline"
                        className="w-full text-sm h-9"
                      >
                        <i className="fas fa-refresh mr-2"></i>
                        New Round
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Participants List */}
            <ParticipantsList 
              participants={room.participants}
              votes={room.votes}
              currentRound={currentRound}
            />

            {/* Results Summary */}
            {room.isRevealed && results && (
              <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-sm">
                    <i className="fas fa-chart-bar mr-2 text-green-600"></i>
                    Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                      <div className="text-xl font-bold text-green-600 mb-1">
                        {results.average.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">Average</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center p-2 bg-white rounded shadow-sm">
                        <div className="font-semibold text-gray-700">{results.participants}</div>
                        <div className="text-gray-500">Participants</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded shadow-sm">
                        <div className="font-semibold text-gray-700">{results.consensus}</div>
                        <div className="text-gray-500">Consensus</div>
                      </div>
                    </div>

                    {isModerator && room.currentStory && (
                      <Button
                        onClick={handleOpenJiraConfig}
                        variant="outline"
                        className="w-full border-green-300 text-green-700 hover:bg-green-50 text-sm"
                      >
                        <i className="fas fa-external-link-alt mr-1"></i>
                        Sync to Jira
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mobile fallback for story management */}
            <div className="lg:hidden">
              {isModerator && (
                <Card className="bg-gradient-to-br from-orange-50 to-yellow-100 border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-sm">
                      <i className="fas fa-edit mr-2 text-orange-600"></i>
                      Story Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <Input
                        type="text"
                        placeholder="Story ID"
                        value={storyInput}
                        onChange={(e) => setStoryInput(e.target.value)}
                        className="text-sm"
                      />
                      <Input
                        type="text"
                        placeholder="Story title (optional)"
                        value={storyTitleInput}
                        onChange={(e) => setStoryTitleInput(e.target.value)}
                        className="text-sm"
                      />
                      <Button 
                        onClick={handleUpdateStory}
                        disabled={!storyInput.trim() || updateRoomMutation.isPending}
                        className="w-full text-sm bg-orange-600 hover:bg-orange-700"
                      >
                        <i className="fas fa-save mr-2"></i>
                        Update Story
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Join Room Dialog */}
      <Dialog open={showJoinDialog && !participantId} onOpenChange={setShowJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Room</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="participantName">Your Name</Label>
              <Input
                id="participantName"
                type="text"
                placeholder="Enter your name"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom(participantName)}
              />
            </div>
            <Button 
              onClick={() => handleJoinRoom(participantName)}
              disabled={!participantName.trim() || joinRoomMutation.isPending}
              className="w-full"
            >
              {joinRoomMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Joining...
                </>
              ) : (
                "Join Room"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Score Reveal Modal */}
      <ScoreRevealModal
        isOpen={shouldShowResults}
        onClose={() => {
          setShowScoreReveal(false);
          if (room?.isRevealed) {
            // If room is revealed, reset the room state
            updateRoomMutation.mutate({
              roomId: roomId!,
              updates: { isRevealed: false }
            });
          }
        }}
        results={results ?? null}
        currentStory={room.currentStory || undefined}
        onOpenJiraConfig={isModerator ? handleOpenJiraConfig : undefined}
        onNewRound={isModerator ? handleNewRound : undefined}
        onSyncToJira={isModerator ? (finalScore: number) => handleSyncToJira(undefined, finalScore) : undefined}
      />

      {/* Jira Sync Modal */}
      <JiraSyncModal
        isOpen={showJiraSync}
        onClose={() => setShowJiraSync(false)}
        storyId={room.currentStory || undefined}
        averagePoints={syncedScore !== undefined ? syncedScore : results?.average}
        participantCount={results?.participants}
      />

      {/* Jira Configuration Modal */}
      <JiraConfigModal
        isOpen={showJiraConfig}
        onClose={() => setShowJiraConfig(false)}
        onSync={handleSyncToJira}
        storyId={room.currentStory || undefined}
        averagePoints={results?.average}
      />
    </div>
  );
}
