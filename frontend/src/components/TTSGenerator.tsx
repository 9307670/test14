import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, Download, Loader2, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGetVoiceProfiles } from '@/hooks/useQueries';
import VoiceEffectControls from './VoiceEffectControls';
import { VoiceEffect, applyVoiceEffect } from '@/lib/audioEffects';

export default function TTSGenerator() {
  const [text, setText] = useState('');
  const [selectedVoiceProfile, setSelectedVoiceProfile] = useState<string>('default');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<Blob | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<VoiceEffect>('normal');
  const [pitch, setPitch] = useState(1);
  const [speed, setSpeed] = useState(1);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const { data: voiceProfiles, isLoading: profilesLoading } = useGetVoiceProfiles();

  const maxCharacters = 500;

  useEffect(() => {
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
      }
    };
  }, []);

  const generateSpeech = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text');
      return;
    }

    if (text.length > maxCharacters) {
      toast.error(`Text exceeds ${maxCharacters} characters`);
      return;
    }

    setIsGenerating(true);

    try {
      // Use Web Speech API for TTS generation
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      
      // Select voice based on profile
      if (selectedVoiceProfile !== 'default' && voices.length > 0) {
        // Try to find a voice that matches preferences
        const preferredVoice = voices.find(v => v.lang.startsWith('en'));
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      // Create audio context to capture speech
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      
      // Record the speech
      const mediaRecorder = new MediaRecorder(destination.stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        // Apply voice effects
        const processedBlob = await applyVoiceEffect(audioBlob, selectedEffect, pitch, speed);
        setGeneratedAudio(processedBlob);
        
        await audioContext.close();
        setIsGenerating(false);
        toast.success('Speech generated successfully!');
      };

      // Start recording
      mediaRecorder.start();

      // Speak the text
      utterance.onend = () => {
        setTimeout(() => {
          mediaRecorder.stop();
        }, 500);
      };

      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        mediaRecorder.stop();
        audioContext.close();
        setIsGenerating(false);
        toast.error('Failed to generate speech');
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error generating speech:', error);
      setIsGenerating(false);
      toast.error('Failed to generate speech');
    }
  };

  const playAudio = () => {
    if (!generatedAudio) return;

    try {
      const url = URL.createObjectURL(generatedAudio);
      
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
      }

      const audio = new Audio(url);
      audioElementRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };

      audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('Could not play audio');
    }
  };

  const pauseAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    }
  };

  const downloadAudio = () => {
    if (!generatedAudio) return;

    try {
      const url = URL.createObjectURL(generatedAudio);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tts-${selectedEffect}-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Audio downloaded');
    } catch (error) {
      console.error('Error downloading audio:', error);
      toast.error('Could not download audio');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-fun-blue/20 shadow-fun">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-fun-blue" />
            Text Input
          </CardTitle>
          <CardDescription>
            Enter text to convert to speech (max {maxCharacters} characters)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Text Input */}
          <div className="space-y-2">
            <Label htmlFor="text-input">Your Text</Label>
            <Textarea
              id="text-input"
              placeholder="Type or paste your text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[150px] text-base"
              maxLength={maxCharacters}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Characters: {text.length} / {maxCharacters}</span>
            </div>
          </div>

          {/* Voice Selection */}
          <div className="space-y-2">
            <Label htmlFor="voice-select">Voice Profile</Label>
            <Select value={selectedVoiceProfile} onValueChange={setSelectedVoiceProfile}>
              <SelectTrigger id="voice-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  <span className="flex items-center gap-2">
                    <span>🎙️</span>
                    <span>Default Voice</span>
                  </span>
                </SelectItem>
                {profilesLoading && (
                  <SelectItem value="loading" disabled>
                    Loading profiles...
                  </SelectItem>
                )}
                {voiceProfiles?.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    <span className="flex items-center gap-2">
                      <span>👤</span>
                      <span>{profile.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={generateSpeech}
              disabled={isGenerating || !text.trim()}
              size="lg"
              className="bg-gradient-to-r from-fun-blue to-fun-green hover:from-fun-blue/90 hover:to-fun-green/90 text-white shadow-fun"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5 mr-2" />
                  Convert to Speech
                </>
              )}
            </Button>

            {generatedAudio && (
              <>
                {!isPlaying ? (
                  <Button
                    onClick={playAudio}
                    size="lg"
                    className="bg-fun-green hover:bg-fun-green/90 text-white"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Play
                  </Button>
                ) : (
                  <Button
                    onClick={pauseAudio}
                    size="lg"
                    className="bg-fun-orange hover:bg-fun-orange/90 text-white"
                  >
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </Button>
                )}

                <Button
                  onClick={downloadAudio}
                  size="lg"
                  className="bg-fun-purple hover:bg-fun-purple/90 text-white"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voice Effect Controls */}
      <VoiceEffectControls
        selectedEffect={selectedEffect}
        onEffectChange={setSelectedEffect}
        pitch={pitch}
        onPitchChange={setPitch}
        speed={speed}
        onSpeedChange={setSpeed}
      />
    </div>
  );
}
