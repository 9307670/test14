import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trash2, Plus, Loader2, User, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetVoiceProfiles,
  useCreateVoiceProfile,
  useDeleteVoiceProfile,
  useUpdateTrainingStatus,
} from '@/hooks/useQueries';
import { TrainingStatus } from '../backend';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function VoiceProfileManager() {
  const [newProfileName, setNewProfileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState<{ [key: string]: number }>({});

  const { data: voiceProfiles, isLoading } = useGetVoiceProfiles();
  const createProfile = useCreateVoiceProfile();
  const deleteProfile = useDeleteVoiceProfile();
  const updateTrainingStatus = useUpdateTrainingStatus();

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      toast.error('Please enter a profile name');
      return;
    }

    setIsCreating(true);

    try {
      // Create profile with sample reference phrases
      const referencePhrases = [
        'Hello, this is my voice.',
        'I am creating a custom voice profile.',
        'This will help generate speech in my voice.',
      ];

      const profileId = await createProfile.mutateAsync({
        name: newProfileName,
        referencePhrases,
      });

      // Simulate training process
      setTrainingProgress({ [profileId]: 0 });
      
      await updateTrainingStatus.mutateAsync({
        profileId,
        status: TrainingStatus.inProgress,
      });

      // Simulate progress
      const interval = setInterval(() => {
        setTrainingProgress((prev) => {
          const current = prev[profileId] || 0;
          if (current >= 100) {
            clearInterval(interval);
            updateTrainingStatus.mutate({
              profileId,
              status: TrainingStatus.completed,
            });
            return prev;
          }
          return { ...prev, [profileId]: current + 10 };
        });
      }, 300);

      setNewProfileName('');
      toast.success('Voice profile created!');
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast.error(error.message || 'Failed to create profile');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProfile = async (profileId: string, profileName: string) => {
    try {
      await deleteProfile.mutateAsync(profileId);
      toast.success(`Profile "${profileName}" deleted`);
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      toast.error(error.message || 'Failed to delete profile');
    }
  };

  const getStatusIcon = (status: TrainingStatus) => {
    switch (status) {
      case TrainingStatus.completed:
        return <CheckCircle2 className="w-4 h-4 text-fun-green" />;
      case TrainingStatus.inProgress:
        return <Loader2 className="w-4 h-4 text-fun-blue animate-spin" />;
      case TrainingStatus.failed:
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: TrainingStatus) => {
    switch (status) {
      case TrainingStatus.completed:
        return <Badge className="bg-fun-green text-white">Ready</Badge>;
      case TrainingStatus.inProgress:
        return <Badge className="bg-fun-blue text-white">Training</Badge>;
      case TrainingStatus.failed:
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Not Started</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Profile */}
      <Card className="border-2 border-fun-green/20 shadow-fun">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-fun-green" />
            Create Voice Profile
          </CardTitle>
          <CardDescription>
            Create a custom voice profile for personalized text-to-speech
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Profile Name</Label>
            <Input
              id="profile-name"
              placeholder="e.g., My Voice, Professional Voice"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <Button
            onClick={handleCreateProfile}
            disabled={isCreating || !newProfileName.trim()}
            className="w-full bg-gradient-to-r from-fun-green to-fun-blue hover:from-fun-green/90 hover:to-fun-blue/90 text-white"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Profile...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Profile
              </>
            )}
          </Button>

          <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
            <p className="font-medium mb-2">💡 How it works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Create a profile with a unique name</li>
              <li>The system will train on default reference phrases</li>
              <li>Use your profile to generate personalized speech</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Existing Profiles */}
      <Card className="border-2 border-fun-purple/20 shadow-fun">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-fun-purple" />
            Your Voice Profiles
          </CardTitle>
          <CardDescription>
            Manage your custom voice profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-fun-purple" />
            </div>
          ) : voiceProfiles && voiceProfiles.length > 0 ? (
            <div className="space-y-4">
              {voiceProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fun-purple to-fun-pink flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{profile.name}</h3>
                        {getStatusIcon(profile.trainingStatus)}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(profile.trainingStatus)}
                        <span className="text-sm text-muted-foreground">
                          {profile.referencePhrases.length} reference phrases
                        </span>
                      </div>
                      {profile.trainingStatus === TrainingStatus.inProgress &&
                        trainingProgress[profile.id] !== undefined && (
                          <div className="mt-2">
                            <Progress value={trainingProgress[profile.id]} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              Training: {trainingProgress[profile.id]}%
                            </p>
                          </div>
                        )}
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Voice Profile</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{profile.name}"? This action cannot be
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteProfile(profile.id, profile.name)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No voice profiles yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first profile to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
