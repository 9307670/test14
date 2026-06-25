import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquareText, Mic } from 'lucide-react';
import TTSGenerator from '@/components/TTSGenerator';
import VoiceProfileManager from '@/components/VoiceProfileManager';

export default function TextToSpeechPage() {
  return (
    <div className="container py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-fun-blue via-fun-green to-fun-yellow bg-clip-text text-transparent">
          Text-to-Speech Studio
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Convert text to speech using custom voice profiles and apply fun voice effects!
        </p>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <MessageSquareText className="w-4 h-4" />
            Generate Speech
          </TabsTrigger>
          <TabsTrigger value="profiles" className="flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Voice Profiles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <TTSGenerator />
        </TabsContent>

        <TabsContent value="profiles">
          <VoiceProfileManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
