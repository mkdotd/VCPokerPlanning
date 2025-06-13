import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { RoomWithParticipants, InsertRoom, InsertParticipant, InsertVote } from "@shared/schema";

export function useRoom(roomId: string | null) {
  return useQuery({
    queryKey: ["/api/rooms", roomId],
    queryFn: () => roomId ? api.getRoom(roomId) : null,
    enabled: !!roomId,
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (room: InsertRoom) => api.createRoom(room),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Room created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create room",
        variant: "destructive",
      });
    },
  });
}

export function useJoinRoom() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ roomId, participant }: { roomId: string; participant: Omit<InsertParticipant, "roomId"> }) =>
      api.joinRoom(roomId, participant),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId] });
      toast({
        title: "Success",
        description: "Joined room successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join room",
        variant: "destructive",
      });
    },
  });
}

export function useSubmitVote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ roomId, vote }: { roomId: string; vote: Omit<InsertVote, "roomId"> }) =>
      api.submitVote(roomId, vote),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId] });
      toast({
        title: "Vote Submitted",
        description: "Your vote has been recorded!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit vote",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ roomId, updates }: { roomId: string; updates: any }) =>
      api.updateRoom(roomId, updates),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId] });
      queryClient.invalidateQueries({ queryKey: ["/api/results", roomId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update room",
        variant: "destructive",
      });
    },
  });
}

export function useStartNewRound() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ roomId, round }: { roomId: string; round?: number }) =>
      api.startNewRound(roomId, round),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId] });
      toast({
        title: "New Round Started",
        description: "All votes have been cleared!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start new round",
        variant: "destructive",
      });
    },
  });
}

export function useSyncToJira() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ roomId, storyId, averagePoints, fieldId }: { 
      roomId: string; 
      storyId: string; 
      averagePoints: number; 
      fieldId?: string;
    }) => api.syncToJira(roomId, storyId, averagePoints, fieldId),
    onSuccess: (data) => {
      const isSimulation = data.mode === "simulation";
      toast({
        title: isSimulation ? "Simulated Sync" : "Synced to Jira",
        description: isSimulation 
          ? "Story sync simulated - check console for details" 
          : "Story has been updated in Jira!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sync to Jira",
        variant: "destructive",
      });
    },
  });
}

export function useResults(roomId: string | null, round: number = 1, enabled: boolean = true) {
  return useQuery({
    queryKey: ["/api/results", roomId, round],
    queryFn: () => roomId ? api.getResults(roomId, round) : null,
    enabled: !!roomId && enabled,
    staleTime: 0, // Always consider data stale
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}
