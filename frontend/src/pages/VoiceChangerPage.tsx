import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LiveVoiceChanger from '@/components/LiveVoiceChanger';
import AudioFileProcessor from '@/components/AudioFileProcessor';
import { Mic, Upload } from 'lucide-react';

export default function VoiceChangerPage() {
  return (
    <div className="container py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-fun-purple via-fun-pink to-fun-yellow bg-clip-text text-transparent">
          Transform Your Voice
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Record live or upload audio files, then apply fun voice effects like robotic, chipmunk, deep voice, and more!
        </p>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Live Recording
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Audio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <LiveVoiceChanger />
        </TabsContent>

        <TabsContent value="upload">
          <AudioFileProcessor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
