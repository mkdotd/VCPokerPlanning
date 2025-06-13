import { 
  rooms, 
  participants, 
  votes,
  type Room, 
  type Participant, 
  type Vote,
  type InsertRoom, 
  type InsertParticipant, 
  type InsertVote,
  type RoomWithParticipants 
} from "@shared/schema";

export interface IStorage {
  // Room operations
  createRoom(room: InsertRoom): Promise<Room>;
  getRoom(id: string): Promise<Room | undefined>;
  getRoomWithParticipants(id: string): Promise<RoomWithParticipants | undefined>;
  updateRoom(id: string, updates: Partial<Room>): Promise<Room | undefined>;
  
  // Participant operations
  addParticipant(participant: InsertParticipant): Promise<Participant>;
  getParticipant(id: string): Promise<Participant | undefined>;
  getParticipantsByRoom(roomId: string): Promise<Participant[]>;
  updateParticipant(id: string, updates: Partial<Participant>): Promise<Participant | undefined>;
  removeParticipant(id: string): Promise<void>;
  
  // Vote operations
  submitVote(vote: InsertVote): Promise<Vote>;
  getVotesByRoom(roomId: string, round?: number): Promise<Vote[]>;
  getParticipantVote(roomId: string, participantId: string, round?: number): Promise<Vote | undefined>;
  clearVotes(roomId: string, round: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private rooms: Map<string, Room>;
  private participants: Map<string, Participant>;
  private votes: Map<string, Vote>;
  private voteIdCounter: number;

  constructor() {
    this.rooms = new Map();
    this.participants = new Map();
    this.votes = new Map();
    this.voteIdCounter = 1;
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const room: Room = {
      ...insertRoom,
      createdAt: new Date(),
    };
    this.rooms.set(room.id, room);
    return room;
  }

  async getRoom(id: string): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async getRoomWithParticipants(id: string): Promise<RoomWithParticipants | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;

    const roomParticipants = Array.from(this.participants.values())
      .filter(p => p.roomId === id && p.isActive);
    
    const roomVotes = Array.from(this.votes.values())
      .filter(v => v.roomId === id);

    return {
      ...room,
      participants: roomParticipants,
      votes: roomVotes,
    };
  }

  async updateRoom(id: string, updates: Partial<Room>): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;

    const updatedRoom = { ...room, ...updates };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async addParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    const id = `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const participant: Participant = {
      ...insertParticipant,
      id,
      joinedAt: new Date(),
    };
    this.participants.set(id, participant);
    return participant;
  }

  async getParticipant(id: string): Promise<Participant | undefined> {
    return this.participants.get(id);
  }

  async getParticipantsByRoom(roomId: string): Promise<Participant[]> {
    return Array.from(this.participants.values())
      .filter(p => p.roomId === roomId && p.isActive);
  }

  async updateParticipant(id: string, updates: Partial<Participant>): Promise<Participant | undefined> {
    const participant = this.participants.get(id);
    if (!participant) return undefined;

    const updatedParticipant = { ...participant, ...updates };
    this.participants.set(id, updatedParticipant);
    return updatedParticipant;
  }

  async removeParticipant(id: string): Promise<void> {
    this.participants.delete(id);
    
    // Also remove votes from this participant
    const votesToRemove = Array.from(this.votes.entries())
      .filter(([_, vote]) => vote.participantId === id)
      .map(([key, _]) => key);
    
    votesToRemove.forEach(key => this.votes.delete(key));
  }

  async submitVote(insertVote: InsertVote): Promise<Vote> {
    // Remove existing vote for this participant in this room/round
    const existingVoteKey = Array.from(this.votes.entries()).find(
      ([_, vote]) => 
        vote.roomId === insertVote.roomId && 
        vote.participantId === insertVote.participantId &&
        vote.round === (insertVote.round || 1)
    )?.[0];
    
    if (existingVoteKey) {
      this.votes.delete(existingVoteKey);
    }

    const vote: Vote = {
      ...insertVote,
      id: this.voteIdCounter++,
      createdAt: new Date(),
    };
    
    const voteKey = `vote_${vote.id}`;
    this.votes.set(voteKey, vote);
    return vote;
  }

  async getVotesByRoom(roomId: string, round: number = 1): Promise<Vote[]> {
    return Array.from(this.votes.values())
      .filter(v => v.roomId === roomId && v.round === round);
  }

  async getParticipantVote(roomId: string, participantId: string, round: number = 1): Promise<Vote | undefined> {
    return Array.from(this.votes.values())
      .find(v => v.roomId === roomId && v.participantId === participantId && v.round === round);
  }

  async clearVotes(roomId: string, round: number): Promise<void> {
    const votesToDelete = Array.from(this.votes.entries())
      .filter(([_, vote]) => vote.roomId === roomId && vote.round === round)
      .map(([key]) => key);
    
    votesToDelete.forEach(key => this.votes.delete(key));
  }
}

export const storage = new MemStorage();
