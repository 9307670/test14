import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { VoiceProfile, TTSAudio, TrainingStatus, EffectSettings } from '../backend';
import { ExternalBlob } from '../backend';

// Voice Profile Queries
export function useGetVoiceProfiles() {
  const { actor, isFetching } = useActor();

  return useQuery<VoiceProfile[]>({
    queryKey: ['voiceProfiles'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getVoiceProfiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetVoiceProfile(profileId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<VoiceProfile | null>({
    queryKey: ['voiceProfile', profileId],
    queryFn: async () => {
      if (!actor || !profileId) return null;
      return actor.getVoiceProfile(profileId);
    },
    enabled: !!actor && !isFetching && !!profileId,
  });
}

export function useCreateVoiceProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      referencePhrases,
    }: {
      name: string;
      referencePhrases: string[];
    }): Promise<string> => {
      if (!actor) throw new Error('Actor not available');
      return actor.createVoiceProfile(name, referencePhrases);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
    },
  });
}

export function useUpdateVoiceProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      profileId,
      referencePhrases,
    }: {
      profileId: string;
      referencePhrases: string[];
    }): Promise<void> => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateVoiceProfile(profileId, referencePhrases);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['voiceProfile', variables.profileId] });
    },
  });
}

export function useDeleteVoiceProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileId: string): Promise<void> => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteVoiceProfile(profileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
    },
  });
}

export function useUpdateTrainingStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      profileId,
      status,
    }: {
      profileId: string;
      status: TrainingStatus;
    }): Promise<void> => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTrainingStatus(profileId, status);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['voiceProfile', variables.profileId] });
    },
  });
}

// TTS Audio Queries
export function useGetTTSAudio() {
  const { actor, isFetching } = useActor();

  return useQuery<TTSAudio[]>({
    queryKey: ['ttsAudio'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTTSAudio();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTTSAudioById(audioId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<TTSAudio | null>({
    queryKey: ['ttsAudio', audioId],
    queryFn: async () => {
      if (!actor || !audioId) return null;
      return actor.getTTSAudioById(audioId);
    },
    enabled: !!actor && !isFetching && !!audioId,
  });
}

export function useSaveTTSAudio() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      text,
      voiceProfileId,
      audioBlob,
      effectSettings,
    }: {
      text: string;
      voiceProfileId: string | null;
      audioBlob: ExternalBlob;
      effectSettings: EffectSettings;
    }): Promise<string> => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveTTSAudio(text, voiceProfileId, audioBlob, effectSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ttsAudio'] });
    },
  });
}

export function useDeleteTTSAudio() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (audioId: string): Promise<void> => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTTSAudio(audioId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ttsAudio'] });
    },
  });
}
