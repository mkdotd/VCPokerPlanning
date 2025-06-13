import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface JiraConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSync: (fieldId?: string) => void;
  storyId?: string;
  averagePoints?: number;
}

export function JiraConfigModal({ 
  isOpen, 
  onClose, 
  onSync,
  storyId,
  averagePoints 
}: JiraConfigModalProps) {
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const { toast } = useToast();

  // Test Jira connection
  const { data: connectionTest, isLoading: testingConnection, refetch: testConnection } = useQuery({
    queryKey: ['jira-connection-test'],
    queryFn: api.testJiraConnection,
    enabled: false, // Don't auto-run
  });

  // Get Jira fields
  const { data: fieldsData, isLoading: loadingFields } = useQuery({
    queryKey: ['jira-fields'],
    queryFn: api.getJiraFields,
    enabled: connectionTest?.connected === true,
  });

  const handleTestConnection = () => {
    testConnection();
  };

  const handleSync = () => {
    onSync(selectedFieldId || undefined);
    onClose();
  };

  const isConfigured = connectionTest?.connected === true;
  const hasFields = fieldsData?.fields && fieldsData.fields.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <i className="fas fa-cog text-purple-600"></i>
            Jira Integration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Story Information */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Story ID</div>
                  <div className="text-lg font-semibold text-blue-600">{storyId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Estimated Points</div>
                  <div className="text-lg font-semibold text-purple-600">{averagePoints}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Jira Connection</h3>
                <Button 
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  variant="outline"
                  size="sm"
                >
                  {testingConnection ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Testing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plug mr-2"></i>
                      Test Connection
                    </>
                  )}
                </Button>
              </div>

              {connectionTest && (
                <div className="flex items-center gap-2">
                  <Badge variant={connectionTest.connected ? "default" : "destructive"}>
                    {connectionTest.connected ? (
                      <><i className="fas fa-check mr-1"></i>Connected</>
                    ) : (
                      <><i className="fas fa-times mr-1"></i>Not Connected</>
                    )}
                  </Badge>
                  <span className="text-sm text-gray-600">{connectionTest.message}</span>
                </div>
              )}

              {!isConfigured && connectionTest && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800">
                    <strong>Configuration Required:</strong>
                    <br />
                    Set the following environment variables to enable Jira integration:
                    <ul className="mt-2 ml-4 list-disc">
                      <li><code>JIRA_BASE_URL</code> - Your Jira instance URL</li>
                      <li><code>JIRA_EMAIL</code> - Your Jira account email</li>
                      <li><code>JIRA_API_TOKEN</code> - Your Jira API token</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Field Selection */}
          {isConfigured && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4">Story Points Field</h3>
                
                {loadingFields ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <i className="fas fa-spinner fa-spin"></i>
                    Loading available fields...
                  </div>
                ) : hasFields ? (
                  <div className="space-y-3">
                    <Label htmlFor="fieldSelect">Select Story Points Field</Label>
                    <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a field or use default" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Use Default (customfield_10016)</SelectItem>
                        {fieldsData.fields.map((field: any) => (
                          <SelectItem key={field.id} value={field.id}>
                            {field.name} ({field.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-gray-500">
                      If you're unsure, leave this as default. Most Jira instances use customfield_10016 for story points.
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    No story-related custom fields found. The default field (customfield_10016) will be used.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {isConfigured ? (
              <Button 
                onClick={handleSync}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <i className="fas fa-sync mr-2"></i>
                Sync to Jira
              </Button>
            ) : (
              <Button 
                onClick={handleSync}
                className="bg-gray-600 hover:bg-gray-700"
              >
                <i className="fas fa-play mr-2"></i>
                Run in Simulation Mode
              </Button>
            )}
            
            <Button 
              onClick={onClose}
              variant="secondary"
            >
              <i className="fas fa-times mr-2"></i>
              Cancel
            </Button>
          </div>

          {/* Information */}
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Simulation Mode:</strong> Logs sync details to console without making API calls.</p>
            <p><strong>Real Mode:</strong> Updates story points directly in your Jira instance.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}