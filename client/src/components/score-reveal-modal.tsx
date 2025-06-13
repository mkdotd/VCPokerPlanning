import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import type { RoomResults } from "@shared/schema";

interface ScoreRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: RoomResults | null;
  currentStory?: string;
  onOpenJiraConfig?: () => void;
  onNewRound?: () => void;
  onSyncToJira?: (finalScore: number) => void;
}

export function ScoreRevealModal({ 
  isOpen, 
  onClose, 
  results, 
  currentStory,
  onOpenJiraConfig,
  onNewRound,
  onSyncToJira 
}: ScoreRevealModalProps) {
  const [editedScore, setEditedScore] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  
  // Initialize edited score when results change
  useEffect(() => {
    if (results) {
      setEditedScore(results.average);
      setIsEditing(false);
    }
  }, [results?.average]);

  if (!results) return null;

  const getParticipantInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getGradientClass = (index: number) => {
    const gradients = [
      "from-blue-400 to-blue-600",
      "from-purple-400 to-purple-600",
      "from-green-400 to-green-600",
      "from-yellow-400 to-yellow-600",
      "from-red-400 to-red-600",
      "from-indigo-400 to-indigo-600",
      "from-pink-400 to-pink-600",
      "from-teal-400 to-teal-600",
    ];
    return gradients[index % gradients.length];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            🎉 Voting Results
          </DialogTitle>
        </DialogHeader>
        
        {/* Results Summary */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {results.average}
                </div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {results.participants}
                </div>
                <div className="text-sm text-gray-600">Participants</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {results.consensus}
                </div>
                <div className="text-sm text-gray-600">Consensus</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Individual Votes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {results.votes.map((vote, index) => (
            <Card key={vote.participantId} className="text-center">
              <CardContent className="p-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${getGradientClass(index)} rounded-full flex items-center justify-center text-white text-sm font-medium mx-auto mb-2`}>
                  {getParticipantInitials(vote.participantName)}
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {vote.participantName}
                </div>
                <div className="text-2xl font-bold text-blue-600 animate-pulse">
                  {vote.value === 'pass' ? 'Pass' : vote.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Score Editing Section */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Final Story Points</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancel" : "Edit Score"}
              </Button>
            </div>
            
            {isEditing ? (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label htmlFor="finalScore">Story Points</Label>
                  <Input
                    id="finalScore"
                    type="number"
                    value={editedScore}
                    onChange={(e) => setEditedScore(Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.5"
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                  }}
                  className="mt-6"
                >
                  Save
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-600">
                  {editedScore} {editedScore === 1 ? 'point' : 'points'}
                </span>
                {editedScore !== results.average && (
                  <span className="text-sm text-gray-500">
                    (Modified from {results.average})
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          {onOpenJiraConfig && (
            <Button 
              onClick={() => {
                if (onSyncToJira) {
                  onSyncToJira(editedScore);
                } else {
                  onOpenJiraConfig();
                }
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <i className="fas fa-sync mr-2"></i>
              Sync {editedScore} {editedScore === 1 ? 'point' : 'points'} to Jira
            </Button>
          )}
          
          {onNewRound && (
            <Button 
              onClick={onNewRound}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <i className="fas fa-refresh mr-2"></i>
              Start New Round
            </Button>
          )}
          
          <Button 
            onClick={onClose}
            variant="secondary"
          >
            <i className="fas fa-times mr-2"></i>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
