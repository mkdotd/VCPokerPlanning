import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRoomSchema, insertParticipantSchema, insertVoteSchema } from "@shared/schema";
import { z } from "zod";
import { createJiraServiceFromEnv, JiraConfigSchema, JiraUpdateSchema } from "./jira";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create a new room
  app.post("/api/rooms", async (req, res) => {
    try {
      const roomData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(roomData);
      res.json(room);
    } catch (error) {
      res.status(400).json({ message: "Invalid room data", error });
    }
  });

  // Get room details with participants and votes
  app.get("/api/rooms/:roomId", async (req, res) => {
    try {
      const { roomId } = req.params;
      const room = await storage.getRoomWithParticipants(roomId);
      
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "Failed to get room", error });
    }
  });

  // Update room (story, reveal status, etc.)
  app.patch("/api/rooms/:roomId", async (req, res) => {
    try {
      const { roomId } = req.params;
      const updates = req.body;
      
      const room = await storage.updateRoom(roomId, updates);
      
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "Failed to update room", error });
    }
  });

  // Join a room (add participant)
  app.post("/api/rooms/:roomId/participants", async (req, res) => {
    try {
      const { roomId } = req.params;
      const participantData = insertParticipantSchema.parse({
        ...req.body,
        roomId,
      });
      
      // Check if room exists
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      const participant = await storage.addParticipant(participantData);
      res.json(participant);
    } catch (error) {
      res.status(400).json({ message: "Invalid participant data", error });
    }
  });

  // Get participants for a room
  app.get("/api/rooms/:roomId/participants", async (req, res) => {
    try {
      const { roomId } = req.params;
      const participants = await storage.getParticipantsByRoom(roomId);
      res.json(participants);
    } catch (error) {
      res.status(500).json({ message: "Failed to get participants", error });
    }
  });

  // Remove participant from room
  app.delete("/api/rooms/:roomId/participants/:participantId", async (req, res) => {
    try {
      const { participantId } = req.params;
      await storage.removeParticipant(participantId);
      res.json({ message: "Participant removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove participant", error });
    }
  });

  // Submit a vote
  app.post("/api/rooms/:roomId/votes", async (req, res) => {
    try {
      const { roomId } = req.params;
      const voteData = insertVoteSchema.parse({
        ...req.body,
        roomId,
      });
      
      // Check if room exists
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      const vote = await storage.submitVote(voteData);
      res.json(vote);
    } catch (error) {
      res.status(400).json({ message: "Invalid vote data", error });
    }
  });

  // Get votes for a room
  app.get("/api/rooms/:roomId/votes", async (req, res) => {
    try {
      const { roomId } = req.params;
      const round = req.query.round ? parseInt(req.query.round as string) : 1;
      const votes = await storage.getVotesByRoom(roomId, round);
      res.json(votes);
    } catch (error) {
      res.status(500).json({ message: "Failed to get votes", error });
    }
  });

  // Get voting results with calculations
  app.get("/api/rooms/:roomId/results", async (req, res) => {
    try {
      const { roomId } = req.params;
      const round = req.query.round ? parseInt(req.query.round as string) : 1;
      
      const room = await storage.getRoomWithParticipants(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      const votes = await storage.getVotesByRoom(roomId, round);
      const participants = room.participants;
      
      // Filter votes from non-moderator participants only and exclude empty votes
      const nonModeratorVotes = votes.filter(vote => {
        const participant = participants.find(p => p.id === vote.participantId);
        return participant && !participant.isModerator && vote.value !== "";
      });



      // Calculate results
      const voteResults = nonModeratorVotes.map(vote => {
        const participant = participants.find(p => p.id === vote.participantId);
        return {
          participantId: vote.participantId,
          participantName: participant?.name || "Unknown",
          value: vote.value,
        };
      });
      
      // Calculate average (excluding 'pass' and 'infinity' votes, including decimals)
      const numericVotes = nonModeratorVotes
        .filter(v => v.value !== 'pass' && v.value !== 'infinity' && !isNaN(parseFloat(v.value)))
        .map(v => parseFloat(v.value));
      
      const average = numericVotes.length > 0 
        ? numericVotes.reduce((sum, val) => sum + val, 0) / numericVotes.length 
        : 0;
      
      // Determine consensus level
      const uniqueValues = new Set(numericVotes);
      let consensus = "High";
      if (uniqueValues.size > 3) consensus = "Low";
      else if (uniqueValues.size > 1) consensus = "Medium";
      
      const results = {
        average: Math.round(average * 10) / 10,
        participants: voteResults.length,
        consensus,
        votes: voteResults,
      };
      
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to get results", error });
    }
  });

  // Start new round (clear votes)
  app.post("/api/rooms/:roomId/new-round", async (req, res) => {
    try {
      const { roomId } = req.params;
      const round = req.body.round || 1;
      
      await storage.clearVotes(roomId, round);
      await storage.updateRoom(roomId, { isRevealed: false });
      
      res.json({ message: "New round started" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start new round", error });
    }
  });

  // Sync to Jira (real API integration)
  app.post("/api/rooms/:roomId/sync-jira", async (req, res) => {
    try {
      const { roomId } = req.params;
      const { storyId, averagePoints, fieldId } = req.body;
      
      if (!storyId || averagePoints === undefined) {
        return res.status(400).json({ 
          message: "Story ID and average points are required" 
        });
      }

      // Try to create Jira service from environment variables
      const jiraService = createJiraServiceFromEnv();
      
      if (!jiraService) {
        // Fall back to simulation if no Jira config
        const syncData = {
          storyId,
          averagePoints,
          roomId,
          timestamp: new Date().toISOString(),
          mode: "simulation"
        };
        
        console.log("=== JIRA SYNC SIMULATION (No Config) ===");
        console.log("Story ID:", syncData.storyId);
        console.log("Average Points:", syncData.averagePoints);
        console.log("Room ID:", syncData.roomId);
        console.log("Timestamp:", syncData.timestamp);
        console.log("Status: Would be sent to Jira API");
        console.log("Note: Set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN for real sync");
        console.log("==========================================");
        
        return res.json({
          message: "Story synced to Jira (simulation mode)",
          syncData,
          mode: "simulation"
        });
      }

      // Real Jira API sync
      try {
        const result = await jiraService.updateStoryPoints({
          storyId,
          storyPoints: Math.round(averagePoints),
          fieldId
        });

        console.log("=== JIRA SYNC SUCCESS ===");
        console.log("Story ID:", storyId);
        console.log("Story Points:", Math.round(averagePoints));
        console.log("Room ID:", roomId);
        console.log("Timestamp:", new Date().toISOString());
        console.log("========================");

        res.json({
          message: "Story synced to Jira successfully",
          result,
          mode: "real"
        });
      } catch (jiraError) {
        // If Jira API fails, log the error but still respond
        console.error("Jira sync failed:", jiraError);
        
        res.status(500).json({ 
          message: `Failed to sync to Jira: ${jiraError instanceof Error ? jiraError.message : String(jiraError)}`,
          mode: "real",
          error: jiraError instanceof Error ? jiraError.message : String(jiraError)
        });
      }
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to sync to Jira", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Test Jira connection
  app.get("/api/jira/test", async (req, res) => {
    try {
      const jiraService = createJiraServiceFromEnv();
      
      if (!jiraService) {
        return res.status(400).json({
          connected: false,
          message: "Jira not configured. Set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN environment variables."
        });
      }

      const isConnected = await jiraService.testConnection();
      
      res.json({
        connected: isConnected,
        message: "Jira connection successful"
      });
    } catch (error) {
      res.status(500).json({
        connected: false,
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get Jira custom fields (helps users find story points field)
  app.get("/api/jira/fields", async (req, res) => {
    try {
      const jiraService = createJiraServiceFromEnv();
      
      if (!jiraService) {
        return res.status(400).json({
          message: "Jira not configured"
        });
      }

      const fields = await jiraService.getCustomFields();
      
      res.json({
        fields,
        message: "Custom fields retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
