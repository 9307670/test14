# Voice Changer Web Application

## Overview
A web application that allows users to modify their voice in real-time or process uploaded audio files with various voice effects. The application features a colorful, child-friendly interface with intuitive controls for recording, applying effects, and downloading processed audio. Additionally, users can generate speech from text using custom voice profiles and apply voice effects to the generated audio.

## Core Features

### Live Voice Processing
- Real-time microphone capture using Web Audio API
- Live voice modification with adjustable parameters:
  - Pitch control (higher/lower voice)
  - Speed control (faster/slower playback)
  - Tone modification (voice character changes)
- Real-time audio preview while speaking into microphone
- Visual feedback showing audio input levels

### Audio File Processing
- Upload audio files for processing (MP3, WAV formats)
- Apply voice effects to uploaded recordings
- Preview processed audio before downloading
- Save processed audio files to device

### Voice Effect Presets
- Predefined voice effects including:
  - Robotic voice
  - Chipmunk (high-pitched)
  - Deep voice (low-pitched)
  - Alien voice
  - Echo effect
  - Reverb effect
- Easy selection via dropdown menu or toggle buttons
- Instant effect application and preview

### Recording System
- Browser-based audio recording functionality
- Record new audio directly in the application
- Multiple recording takes with ability to select best version
- Recording duration display and controls

### Text-to-Speech System
- Dedicated Text-to-Speech page with clean interface
- Text input box with adjustable character limits
- "Convert to Speech" button for audio generation
- Voice selection options:
  - Default system voice
  - User's recorded custom voice profile
  - Alternative tone variations
- Generated audio playback and download functionality
- Integration with existing voice changer effects (pitch, speed, tone modifications)
- Apply voice effect presets to generated TTS audio

### Custom Voice Profile Creation
- Upload reference phrase recordings to build personalized voice profiles
- Voice profile training system with progress feedback
- Local storage of custom voice profiles for reuse
- Multiple voice profile management (create, select, delete)
- Reference phrase recording guidelines and prompts

### User Interface
- Playful, child-oriented design with bright colors consistent across all pages
- Visual slider controls for fine-tuning effects:
  - Pitch adjustment slider
  - Speed modification slider
  - Effect intensity controls
- Clear, large buttons for primary actions:
  - Record button (start/stop recording)
  - Play button (preview audio)
  - Apply Effect button (process audio)
  - Download button (save processed file)
  - Convert to Speech button (TTS generation)
- Responsive design for various screen sizes
- Visual waveform display for audio feedback
- Navigation between voice changer and TTS pages

### Audio Controls
- Play/pause functionality for recorded and processed audio
- Volume control for playback
- Audio scrubbing/seeking capability
- Clear audio buffer and reset functionality
- TTS audio preview and playback controls

## Technical Requirements
- Web Audio API integration for real-time audio processing
- MediaRecorder API for browser-based recording
- Text-to-Speech API integration for voice synthesis
- File upload and download functionality
- Audio format conversion and processing
- Responsive React interface with intuitive controls
- Real-time audio visualization and feedback
- Cross-browser compatibility for audio features
- Local storage for custom voice profiles and user preferences
- English language content throughout the application

## Data Storage
### Frontend Storage
- Custom voice profiles stored locally in browser
- User preferences and settings
- Temporary audio files and processing cache
- TTS generation history and favorites

### Backend Storage
- Voice profile training data and models
- TTS processing and generation services
- User voice profile backups and synchronization
- Audio processing optimization and caching

The application requires backend services for TTS generation, voice profile training, and data synchronization, while maintaining frontend-first audio processing for real-time effects and playback.
