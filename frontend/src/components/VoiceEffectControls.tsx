import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles } from 'lucide-react';
import { VoiceEffect } from '@/lib/audioEffects';

interface VoiceEffectControlsProps {
  selectedEffect: VoiceEffect;
  onEffectChange: (effect: VoiceEffect) => void;
  pitch: number;
  onPitchChange: (pitch: number) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

const effectPresets: { value: VoiceEffect; label: string; icon: string }[] = [
  { value: 'normal', label: 'Normal', icon: '😊' },
  { value: 'robotic', label: 'Robotic', icon: '🤖' },
  { value: 'chipmunk', label: 'Chipmunk', icon: '🐿️' },
  { value: 'deep', label: 'Deep Voice', icon: '🎙️' },
  { value: 'alien', label: 'Alien', icon: '👽' },
  { value: 'echo', label: 'Echo', icon: '🔊' },
  { value: 'reverb', label: 'Reverb', icon: '🎵' },
];

export default function VoiceEffectControls({
  selectedEffect,
  onEffectChange,
  pitch,
  onPitchChange,
  speed,
  onSpeedChange,
}: VoiceEffectControlsProps) {
  return (
    <Card className="border-2 border-fun-yellow/20 shadow-fun">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-fun-yellow" />
          Voice Effects
        </CardTitle>
        <CardDescription>
          Choose a preset or customize with sliders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Effect Preset Selection */}
        <div className="space-y-2">
          <Label htmlFor="effect-preset">Effect Preset</Label>
          <Select value={selectedEffect} onValueChange={(value) => onEffectChange(value as VoiceEffect)}>
            <SelectTrigger id="effect-preset" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {effectPresets.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  <span className="flex items-center gap-2">
                    <span>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Pitch Control */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label htmlFor="pitch-slider">Pitch</Label>
            <span className="text-sm font-medium text-fun-purple">
              {pitch.toFixed(2)}x
            </span>
          </div>
          <Slider
            id="pitch-slider"
            min={0.5}
            max={2}
            step={0.1}
            value={[pitch]}
            onValueChange={(values) => onPitchChange(values[0])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Lower</span>
            <span>Normal</span>
            <span>Higher</span>
          </div>
        </div>

        {/* Speed Control */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label htmlFor="speed-slider">Speed</Label>
            <span className="text-sm font-medium text-fun-pink">
              {speed.toFixed(2)}x
            </span>
          </div>
          <Slider
            id="speed-slider"
            min={0.5}
            max={2}
            step={0.1}
            value={[speed]}
            onValueChange={(values) => onSpeedChange(values[0])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Slower</span>
            <span>Normal</span>
            <span>Faster</span>
          </div>
        </div>

        {/* Effect Mascots */}
        <div className="grid grid-cols-3 gap-3 pt-4">
          {selectedEffect === 'robotic' && (
            <div className="col-span-3 flex justify-center">
              <img
                src="/assets/generated/robot-mascot-transparent.dim_128x128.png"
                alt="Robot"
                className="w-24 h-24 animate-float"
              />
            </div>
          )}
          {selectedEffect === 'chipmunk' && (
            <div className="col-span-3 flex justify-center">
              <img
                src="/assets/generated/chipmunk-mascot-transparent.dim_128x128.png"
                alt="Chipmunk"
                className="w-24 h-24 animate-bounce-gentle"
              />
            </div>
          )}
          {selectedEffect === 'alien' && (
            <div className="col-span-3 flex justify-center">
              <img
                src="/assets/generated/alien-mascot-transparent.dim_128x128.png"
                alt="Alien"
                className="w-24 h-24 animate-wiggle"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
