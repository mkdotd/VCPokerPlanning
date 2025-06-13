import { z } from "zod";

// Jira configuration schema
export const JiraConfigSchema = z.object({
  baseUrl: z.string().url(),
  email: z.string().email(),
  apiToken: z.string(),
  projectKey: z.string().optional(),
});

export type JiraConfig = z.infer<typeof JiraConfigSchema>;

// Jira story update payload
export const JiraUpdateSchema = z.object({
  storyId: z.string(),
  storyPoints: z.number(),
  fieldId: z.string().optional(), // Custom field ID for story points
});

export type JiraUpdate = z.infer<typeof JiraUpdateSchema>;

export class JiraService {
  private config: JiraConfig;

  constructor(config: JiraConfig) {
    this.config = config;
  }

  private getAuthHeader(): string {
    const auth = Buffer.from(`${this.config.email}:${this.config.apiToken}`).toString('base64');
    return `Basic ${auth}`;
  }

  private async makeJiraRequest(endpoint: string, method: string = 'GET', body?: any) {
    const url = `${this.config.baseUrl}/rest/api/3${endpoint}`;
    
    const headers: Record<string, string> = {
      'Authorization': this.getAuthHeader(),
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jira API Error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  // Get issue details
  async getIssue(issueKey: string) {
    try {
      return await this.makeJiraRequest(`/issue/${issueKey}`);
    } catch (error) {
      throw new Error(`Failed to fetch issue ${issueKey}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Update story points for an issue
  async updateStoryPoints(update: JiraUpdate): Promise<any> {
    try {
      // First, get the issue to understand its current state
      const issue = await this.getIssue(update.storyId);
      
      // Default story points field ID (most common)
      const storyPointsField = update.fieldId || 'customfield_10016';
      
      const updatePayload = {
        fields: {
          [storyPointsField]: update.storyPoints
        }
      };

      const result = await this.makeJiraRequest(`/issue/${update.storyId}`, 'PUT', updatePayload);
      
      return {
        success: true,
        issueKey: update.storyId,
        storyPoints: update.storyPoints,
        message: `Successfully updated story points for ${update.storyId}`,
        jiraResponse: result
      };
    } catch (error) {
      throw new Error(`Failed to update story points for ${update.storyId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Get project info (useful for validation)
  async getProject(projectKey?: string) {
    const key = projectKey || this.config.projectKey;
    if (!key) {
      throw new Error('Project key is required');
    }
    
    try {
      return await this.makeJiraRequest(`/project/${key}`);
    } catch (error) {
      throw new Error(`Failed to fetch project ${key}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Get custom fields to help users find the correct story points field
  async getCustomFields() {
    try {
      const fields = await this.makeJiraRequest('/field');
      return fields.filter((field: any) => field.custom && field.name.toLowerCase().includes('story'));
    } catch (error) {
      throw new Error(`Failed to fetch custom fields: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.makeJiraRequest('/myself');
      return true;
    } catch (error) {
      throw new Error(`Jira connection test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Factory function to create JiraService from environment variables
export function createJiraServiceFromEnv(): JiraService | null {
  const jiraConfig = {
    baseUrl: process.env.JIRA_BASE_URL,
    email: process.env.JIRA_EMAIL,
    apiToken: process.env.JIRA_API_TOKEN,
    projectKey: process.env.JIRA_PROJECT_KEY,
  };

  // Check if all required fields are present
  if (!jiraConfig.baseUrl || !jiraConfig.email || !jiraConfig.apiToken) {
    return null;
  }

  try {
    const validatedConfig = JiraConfigSchema.parse(jiraConfig);
    return new JiraService(validatedConfig);
  } catch (error) {
    console.error('Invalid Jira configuration:', error);
    return null;
  }
}