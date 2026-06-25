export type VoiceEffect = 'normal' | 'robotic' | 'chipmunk' | 'deep' | 'alien' | 'echo' | 'reverb';

export async function applyVoiceEffect(
  audioBlob: Blob,
  effect: VoiceEffect,
  pitchMultiplier: number,
  speedMultiplier: number
): Promise<Blob> {
  const audioContext = new AudioContext();
  
  try {
    // Convert blob to array buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Apply effect based on selection
    let processedBuffer: AudioBuffer;
    
    switch (effect) {
      case 'robotic':
        processedBuffer = await applyRoboticEffect(audioContext, audioBuffer, pitchMultiplier * 0.9);
        break;
      case 'chipmunk':
        processedBuffer = await applyPitchShift(audioContext, audioBuffer, pitchMultiplier * 1.8);
        break;
      case 'deep':
        processedBuffer = await applyPitchShift(audioContext, audioBuffer, pitchMultiplier * 0.6);
        break;
      case 'alien':
        processedBuffer = await applyAlienEffect(audioContext, audioBuffer, pitchMultiplier * 1.3);
        break;
      case 'echo':
        processedBuffer = await applyEchoEffect(audioContext, audioBuffer, pitchMultiplier);
        break;
      case 'reverb':
        processedBuffer = await applyReverbEffect(audioContext, audioBuffer, pitchMultiplier);
        break;
      default:
        processedBuffer = await applyPitchShift(audioContext, audioBuffer, pitchMultiplier);
    }

    // Apply speed change
    const finalBuffer = await applySpeedChange(audioContext, processedBuffer, speedMultiplier);

    // Convert back to blob
    const blob = await audioBufferToBlob(finalBuffer);
    
    await audioContext.close();
    return blob;
  } catch (error) {
    await audioContext.close();
    throw error;
  }
}

async function applyPitchShift(
  audioContext: AudioContext,
  audioBuffer: AudioBuffer,
  pitchMultiplier: number
): Promise<AudioBuffer> {
  const sampleRate = audioBuffer.sampleRate;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = Math.floor(audioBuffer.length / pitchMultiplier);
  
  const newBuffer = audioContext.createBuffer(numberOfChannels, length, sampleRate);
  
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = newBuffer.getChannelData(channel);
    
    for (let i = 0; i < length; i++) {
      const sourceIndex = i * pitchMultiplier;
      const index0 = Math.floor(sourceIndex);
      const index1 = Math.min(index0 + 1, inputData.length - 1);
      const fraction = sourceIndex - index0;
      
      outputData[i] = inputData[index0] * (1 - fraction) + inputData[index1] * fraction;
    }
  }
  
  return newBuffer;
}

async function applyRoboticEffect(
  audioContext: AudioContext,
  audioBuffer: AudioBuffer,
  pitchMultiplier: number
): Promise<AudioBuffer> {
  const buffer = await applyPitchShift(audioContext, audioBuffer, pitchMultiplier);
  const numberOfChannels = buffer.numberOfChannels;
  
  // Add robotic distortion
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel);
    
    for (let i = 0; i < data.length; i++) {
      // Apply bit crushing effect
      const steps = 8;
      data[i] = Math.round(data[i] * steps) / steps;
      
      // Add slight modulation
      data[i] *= 1 + 0.1 * Math.sin(i * 0.01);
    }
  }
  
  return buffer;
}

async function applyAlienEffect(
  audioContext: AudioContext,
  audioBuffer: AudioBuffer,
  pitchMultiplier: number
): Promise<AudioBuffer> {
  const buffer = await applyPitchShift(audioContext, audioBuffer, pitchMultiplier);
  const numberOfChannels = buffer.numberOfChannels;
  
  // Add alien-like modulation
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel);
    
    for (let i = 0; i < data.length; i++) {
      // Add frequency modulation
      const modulation = Math.sin(i * 0.005) * 0.3;
      data[i] *= 1 + modulation;
      
      // Add tremolo effect
      data[i] *= 0.7 + 0.3 * Math.sin(i * 0.002);
    }
  }
  
  return buffer;
}

async function applyEchoEffect(
  audioContext: AudioContext,
  audioBuffer: AudioBuffer,
  pitchMultiplier: number
): Promise<AudioBuffer> {
  const buffer = await applyPitchShift(audioContext, audioBuffer, pitchMultiplier);
  const sampleRate = buffer.sampleRate;
  const numberOfChannels = buffer.numberOfChannels;
  const delayTime = 0.3; // 300ms delay
  const delaySamples = Math.floor(delayTime * sampleRate);
  const decay = 0.4;
  
  const newLength = buffer.length + delaySamples * 2;
  const newBuffer = audioContext.createBuffer(numberOfChannels, newLength, sampleRate);
  
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const inputData = buffer.getChannelData(channel);
    const outputData = newBuffer.getChannelData(channel);
    
    // Copy original
    for (let i = 0; i < inputData.length; i++) {
      outputData[i] = inputData[i];
    }
    
    // Add echoes
    for (let echo = 1; echo <= 2; echo++) {
      const offset = delaySamples * echo;
      const echoDecay = Math.pow(decay, echo);
      
      for (let i = 0; i < inputData.length; i++) {
        if (i + offset < outputData.length) {
          outputData[i + offset] += inputData[i] * echoDecay;
        }
      }
    }
  }
  
  return newBuffer;
}

async function applyReverbEffect(
  audioContext: AudioContext,
  audioBuffer: AudioBuffer,
  pitchMultiplier: number
): Promise<AudioBuffer> {
  const buffer = await applyPitchShift(audioContext, audioBuffer, pitchMultiplier);
  const sampleRate = buffer.sampleRate;
  const numberOfChannels = buffer.numberOfChannels;
  const reverbTime = 0.05; // 50ms
  const reverbSamples = Math.floor(reverbTime * sampleRate);
  
  const newLength = buffer.length + reverbSamples;
  const newBuffer = audioContext.createBuffer(numberOfChannels, newLength, sampleRate);
  
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const inputData = buffer.getChannelData(channel);
    const outputData = newBuffer.getChannelData(channel);
    
    // Copy original
    for (let i = 0; i < inputData.length; i++) {
      outputData[i] = inputData[i];
    }
    
    // Add multiple short delays for reverb effect
    const delays = [7, 13, 19, 29, 37];
    delays.forEach((delay) => {
      const delaySamples = Math.floor((delay / 1000) * sampleRate);
      const decay = 0.3;
      
      for (let i = 0; i < inputData.length; i++) {
        if (i + delaySamples < outputData.length) {
          outputData[i + delaySamples] += inputData[i] * decay;
        }
      }
    });
  }
  
  return newBuffer;
}

async function applySpeedChange(
  audioContext: AudioContext,
  audioBuffer: AudioBuffer,
  speedMultiplier: number
): Promise<AudioBuffer> {
  if (speedMultiplier === 1) return audioBuffer;
  
  const sampleRate = audioBuffer.sampleRate;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = Math.floor(audioBuffer.length / speedMultiplier);
  
  const newBuffer = audioContext.createBuffer(numberOfChannels, length, sampleRate);
  
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const inputData = audioBuffer.getChannelData(channel);
    const outputData = newBuffer.getChannelData(channel);
    
    for (let i = 0; i < length; i++) {
      const sourceIndex = i * speedMultiplier;
      const index0 = Math.floor(sourceIndex);
      const index1 = Math.min(index0 + 1, inputData.length - 1);
      const fraction = sourceIndex - index0;
      
      outputData[i] = inputData[index0] * (1 - fraction) + inputData[index1] * fraction;
    }
  }
  
  return newBuffer;
}

async function audioBufferToBlob(audioBuffer: AudioBuffer): Promise<Blob> {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  
  // Create WAV file
  const wavBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(wavBuffer);
  
  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, length * numberOfChannels * 2, true);
  
  // Write audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
