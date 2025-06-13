import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface JiraSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyId?: string;
  averagePoints?: number;
  participantCount?: number;
}

export function JiraSyncModal({ 
  isOpen, 
  onClose, 
  storyId,
  averagePoints,
  participantCount 
}: JiraSyncModalProps) {
  const timestamp = new Date().toLocaleString();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-check text-white text-2xl"></i>
          </div>
          
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 mb-2">
              Synced to Jira!
            </DialogTitle>
          </DialogHeader>
          
          <p className="text-gray-600 mb-4">
            Story {storyId} has been updated with an average estimate of {averagePoints} points.
          </p>
          
          <Card className="bg-gray-50 mb-4">
            <CardContent className="p-4 text-left">
              <div className="text-sm font-medium text-gray-900 mb-2">
                Sync Details:
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• Story ID: <span className="font-mono">{storyId}</span></div>
                <div>• Average Points: <span className="font-mono">{averagePoints}</span></div>
                <div>• Participants: <span className="font-mono">{participantCount}</span></div>
                <div>• Timestamp: <span className="font-mono">{timestamp}</span></div>
              </div>
            </CardContent>
          </Card>
          
          <Button 
            onClick={onClose}
            className="w-full"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
