import { apiRequest } from "./queryClient";
import type { 
  Room, 
  Participant, 
  Vote, 
  InsertRoom, 
  InsertParticipant, 
  InsertVote,
  RoomWithParticipants,
  RoomResults 
} from "@shared/schema";

export const api = {
  // Room operations
  createRoom: async (room: InsertRoom): Promise<Room> => {
    const response = await apiRequest("POST", "/api/rooms", room);
    return response.json();
  },

  getRoom: async (roomId: string): Promise<RoomWithParticipants> => {
    const response = await apiRequest("GET", `/api/rooms/${roomId}`);
    return response.json();
  },

  updateRoom: async (roomId: string, updates: Partial<Room>): Promise<Room> => {
    const response = await apiRequest("PATCH", `/api/rooms/${roomId}`, updates);
    return response.json();
  },

  // Participant operations
  joinRoom: async (roomId: string, participant: Omit<InsertParticipant, "roomId">): Promise<Participant> => {
    const response = await apiRequest("POST", `/api/rooms/${roomId}/participants`, participant);
    return response.json();
  },

  // Vote operations
  submitVote: async (roomId: string, vote: Omit<InsertVote, "roomId">): Promise<Vote> => {
    const response = await apiRequest("POST", `/api/rooms/${roomId}/votes`, vote);
    return response.json();
  },

  getResults: async (roomId: string, round: number = 1): Promise<RoomResults> => {
    const response = await apiRequest("GET", `/api/rooms/${roomId}/results?round=${round}`);
    return response.json();
  },

  // Room actions
  startNewRound: async (roomId: string, round: number = 1): Promise<void> => {
    await apiRequest("POST", `/api/rooms/${roomId}/new-round`, { round });
  },

  syncToJira: async (roomId: string, storyId: string, averagePoints: number, fieldId?: string): Promise<any> => {
    const response = await apiRequest("POST", `/api/rooms/${roomId}/sync-jira`, {
      storyId,
      averagePoints,
      fieldId,
    });
    return response.json();
  },

  removeParticipant: async (roomId: string, participantId: string): Promise<any> => {
    const response = await apiRequest("DELETE", `/api/rooms/${roomId}/participants/${participantId}`);
    return response.json();
  },

  // Jira configuration endpoints
  testJiraConnection: async (): Promise<any> => {
    const response = await apiRequest("GET", "/api/jira/test");
    return response.json();
  },

  getJiraFields: async (): Promise<any> => {
    const response = await apiRequest("GET", "/api/jira/fields");
    return response.json();
  },
};
