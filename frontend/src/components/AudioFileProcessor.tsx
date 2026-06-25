import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Play, Pause, Download, FileAudio } from 'lucide-react';
import { toast } from 'sonner';
import VoiceEffectControls from './VoiceEffectControls';
import { VoiceEffect, applyVoiceEffect } from '@/lib/audioEffects';

export default function AudioFileProcessor() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState<VoiceEffect>('normal');
  const [pitch, setPitch] = useState(1);
  const [speed, setSpeed] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setUploadedFile(file);
        toast.success('Audio file uploaded');
      } else {
        toast.error('Please upload a valid audio file (MP3, WAV, etc.)');
      }
    }
  };

  const playAudio = async () => {
    if (!uploadedFile) return;

    try {
      const processedBlob = await applyVoiceEffect(
        uploadedFile,
        selectedEffect,
        pitch,
        speed
      );

      const url = URL.createObjectURL(processedBlob);
      
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
      toast.success('Playing with effects applied');
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('Could not play audio');
    }
  };

  const pausePlayback = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    }
  };

  const downloadProcessedAudio = async () => {
    if (!uploadedFile) return;

    try {
      const processedBlob = await applyVoiceEffect(
        uploadedFile,
        selectedEffect,
        pitch,
        speed
      );

      const url = URL.createObjectURL(processedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `processed-${selectedEffect}-${uploadedFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Processed audio downloaded');
    } catch (error) {
      console.error('Error downloading audio:', error);
      toast.error('Could not download audio');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-fun-pink/20 shadow-fun">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-fun-pink" />
            Upload Audio File
          </CardTitle>
          <CardDescription>
            Upload an audio file and apply voice effects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-fun-pink/30 rounded-lg p-8 text-center cursor-pointer hover:border-fun-pink/50 hover:bg-fun-pink/5 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {uploadedFile ? (
              <div className="space-y-2">
                <FileAudio className="w-12 h-12 mx-auto text-fun-pink" />
                <p className="font-medium text-foreground">{uploadedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedFile(null);
                    if (audioElementRef.current) {
                      audioElementRef.current.pause();
                      audioElementRef.current.src = '';
                    }
                    setIsPlaying(false);
                  }}
                  className="mt-2"
                >
                  Remove File
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="font-medium text-foreground">Click to upload audio file</p>
                <p className="text-sm text-muted-foreground">
                  Supports MP3, WAV, and other audio formats
                </p>
              </div>
            )}
          </div>

          {/* Playback Controls */}
          {uploadedFile && (
            <div className="flex flex-wrap gap-3 justify-center">
              {!isPlaying ? (
                <Button
                  onClick={playAudio}
                  size="lg"
                  className="bg-fun-green hover:bg-fun-green/90 text-white"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Play Preview
                </Button>
              ) : (
                <Button
                  onClick={pausePlayback}
                  size="lg"
                  className="bg-fun-orange hover:bg-fun-orange/90 text-white"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
              )}

              <Button
                onClick={downloadProcessedAudio}
                size="lg"
                className="bg-fun-blue hover:bg-fun-blue/90 text-white"
              >
                <Download className="w-5 h-5 mr-2" />
                Download
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voice Effect Controls */}
      {uploadedFile && (
        <VoiceEffectControls
          selectedEffect={selectedEffect}
          onEffectChange={setSelectedEffect}
          pitch={pitch}
          onPitchChange={setPitch}
          speed={speed}
          onSpeedChange={setSpeed}
        />
      )}
    </div>
  );
}
