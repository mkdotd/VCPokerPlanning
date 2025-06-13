import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Participant, Vote } from "@shared/schema";

interface ParticipantsListProps {
  participants: Participant[];
  votes: Vote[];
  currentRound?: number;
}

export function ParticipantsList({ participants, votes, currentRound = 1 }: ParticipantsListProps) {
  const activeParticipants = participants.filter(p => p.isActive);
  const nonModeratorParticipants = activeParticipants.filter(p => !p.isModerator);
  const votedParticipants = votes.filter(v => v.round === currentRound);
  const nonModeratorVotes = votes.filter(v => {
    const participant = activeParticipants.find(p => p.id === v.participantId);
    return v.round === currentRound && participant && !participant.isModerator && v.value !== "";
  });
  const votingProgress = nonModeratorParticipants.length > 0 
    ? (nonModeratorVotes.length / nonModeratorParticipants.length) * 100 
    : 0;

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

  const hasVoted = (participantId: string) => {
    const vote = votedParticipants.find(v => v.participantId === participantId);
    return vote && vote.value !== ""; // Empty value means no vote
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Participants</CardTitle>
          <Badge variant="secondary">
            {activeParticipants.length} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activeParticipants.map((participant, index) => (
            <div 
              key={participant.id} 
              className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg relative ${
                hasVoted(participant.id) ? 'participant-voted' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 bg-gradient-to-r ${getGradientClass(index)} rounded-full flex items-center justify-center text-white text-sm font-medium`}>
                  {getParticipantInitials(participant.name)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {participant.name}
                  </p>
                  <p className="text-xs flex items-center">
                    {participant.isModerator ? (
                      <span className="text-purple-600">
                        <i className="fas fa-crown text-purple-400 mr-1" style={{fontSize: "8px"}}></i>
                        Moderator
                      </span>
                    ) : hasVoted(participant.id) ? (
                      <span className="text-green-600">
                        <i className="fas fa-check text-green-400 mr-1" style={{fontSize: "8px"}}></i>
                        Voted
                      </span>
                    ) : (
                      <span className="text-gray-500">
                        <i className="fas fa-clock mr-1"></i>
                        Thinking...
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              {hasVoted(participant.id) && !participant.isModerator && (
                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center">
                  <i className="fas fa-check text-white text-xs"></i>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Voting Progress</span>
            <span className="font-medium text-gray-900">
              {nonModeratorVotes.length}/{nonModeratorParticipants.length} participants
            </span>
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${votingProgress}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
