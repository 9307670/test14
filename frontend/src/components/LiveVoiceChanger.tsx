import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Square, Play, Pause, Download } from 'lucide-react';
import { toast } from 'sonner';
import VoiceEffectControls from './VoiceEffectControls';
import AudioVisualizer from './AudioVisualizer';
import { VoiceEffect, applyVoiceEffect } from '@/lib/audioEffects';

export default function LiveVoiceChanger() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [selectedEffect, setSelectedEffect] = useState<VoiceEffect>('normal');
  const [pitch, setPitch] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordedAudioRef = useRef<Blob | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopAudioVisualization();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio context for visualization
      audioContextRef.current = new AudioContext();
      sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      sourceNodeRef.current.connect(analyserRef.current);
      
      startAudioVisualization();

      // Setup media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        recordedAudioRef.current = audioBlob;
        setHasRecording(true);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        stopAudioVisualization();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start timer
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      toast.success('Recording started');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      toast.success('Recording stopped');
    }
  };

  const startAudioVisualization = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255);
      
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  };

  const stopAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAudioLevel(0);
  };

  const playRecording = async () => {
    if (!recordedAudioRef.current) return;

    try {
      // Apply effect to the recording
      const processedBlob = await applyVoiceEffect(
        recordedAudioRef.current,
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

  const downloadRecording = async () => {
    if (!recordedAudioRef.current) return;

    try {
      const processedBlob = await applyVoiceEffect(
        recordedAudioRef.current,
        selectedEffect,
        pitch,
        speed
      );

      const url = URL.createObjectURL(processedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-recording-${selectedEffect}-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Recording downloaded');
    } catch (error) {
      console.error('Error downloading audio:', error);
      toast.error('Could not download audio');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-fun-purple/20 shadow-fun">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-fun-purple" />
            Live Recording
          </CardTitle>
          <CardDescription>
            Record your voice and apply effects in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Audio Visualizer */}
          <AudioVisualizer level={audioLevel} isActive={isRecording} />

          {/* Recording Duration */}
          {(isRecording || hasRecording) && (
            <div className="text-center">
              <p className="text-2xl font-bold text-fun-purple">
                {formatDuration(recordingDuration)}
              </p>
            </div>
          )}

          {/* Recording Controls */}
          <div className="flex flex-wrap gap-3 justify-center">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                size="lg"
                className="bg-gradient-to-r from-fun-purple to-fun-pink hover:from-fun-purple/90 hover:to-fun-pink/90 text-white shadow-fun"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                size="lg"
                variant="destructive"
                className="shadow-fun"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop Recording
              </Button>
            )}

            {hasRecording && !isRecording && (
              <>
                {!isPlaying ? (
                  <Button
                    onClick={playRecording}
                    size="lg"
                    className="bg-fun-green hover:bg-fun-green/90 text-white"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Play
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
                  onClick={downloadRecording}
                  size="lg"
                  className="bg-fun-blue hover:bg-fun-blue/90 text-white"
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
