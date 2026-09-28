import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, r, g, b, iconType = 'bell') {
  const buffer = Buffer.alloc(width * height * 4);
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.42;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        const bellY = (y - cy) / (radius * 0.7);
        const bellX = (x - cx) / (radius * 0.7);
        
        let isBell = false;
        if (bellY >= -0.6 && bellY <= 0.4) {
          const bellWidthAtY = 0.2 + 0.45 * Math.pow((bellY + 0.6), 1.6);
          if (Math.abs(bellX) <= bellWidthAtY) {
            isBell = true;
          }
        }
        if (bellY > 0.4 && bellY <= 0.6 && Math.abs(bellX) <= 0.65) {
          isBell = true;
        }
        if (bellY > 0.6 && bellY <= 0.8 && Math.sqrt(bellX * bellX + (bellY - 0.7) * (bellY - 0.7)) <= 0.18) {
          isBell = true;
        }
        if (bellY < -0.6 && bellY >= -0.8 && Math.sqrt(bellX * bellX + (bellY + 0.7) * (bellY + 0.7)) <= 0.18) {
          isBell = true;
        }

        if (isBell) {
          buffer[idx] = 251;     // R
          buffer[idx + 1] = 191; // G
          buffer[idx + 2] = 36;  // B
          buffer[idx + 3] = 255; // A
        } else {
          buffer[idx] = 30;      // R
          buffer[idx + 1] = 64;  // G
          buffer[idx + 2] = 175; // B
          buffer[idx + 3] = 255; // A
        }
      } else {
        buffer[idx] = 30;
        buffer[idx + 1] = 64;
        buffer[idx + 2] = 175;
        buffer[idx + 3] = 0;
      }
    }
  }

  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  let srcOffset = 0;
  let dstOffset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[dstOffset++] = 0;
    buffer.copy(scanlines, dstOffset, srcOffset, srcOffset + width * 4);
    dstOffset += width * 4;
    srcOffset += width * 4;
  }

  const compressedData = zlib.deflateSync(scanlines);
  const pngSig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  function createChunk(type, data) {
    const len = data.length;
    const chunk = Buffer.alloc(12 + len);
    chunk.writeUInt32BE(len, 0);
    chunk.write(type, 4, 4, 'ascii');
    data.copy(chunk, 8);
    const crc = crc32(chunk.subarray(4, 8 + len));
    chunk.writeUInt32BE(crc, 8 + len);
    return chunk;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let n = 0; n < buf.length; n++) {
      c = (c >>> 8) ^ crcTable[(c ^ buf[n]) & 0xff];
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([pngSig, ihdrChunk, idatChunk, iendChunk]);
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

// Generate Realistic 4-Chime Westminster School Bell
// Notes: E5 (659.25Hz), C#5 (554.37Hz), B4 (493.88Hz), E4 (329.63Hz)
function createRealisticBellWav() {
  const sampleRate = 44100;
  const notes = [
    { freq: 659.25, start: 0.0,  duration: 0.72 }, // E5
    { freq: 554.37, start: 0.75, duration: 0.72 }, // C#5
    { freq: 493.88, start: 1.50, duration: 0.72 }, // B4
    { freq: 329.63, start: 2.25, duration: 1.50 }, // E4
  ];

  const totalDuration = 3.85; // ~3.8 seconds matching uploaded audio
  const numSamples = Math.floor(sampleRate * totalDuration);
  const pcmBuffer = Buffer.alloc(numSamples * 2);

  // Initialize samples array
  const samples = new Float32Array(numSamples);

  for (const note of notes) {
    const startIndex = Math.floor(note.start * sampleRate);
    const noteSampleCount = Math.floor(note.duration * sampleRate);

    for (let i = 0; i < noteSampleCount && (startIndex + i) < numSamples; i++) {
      const t = i / sampleRate;
      
      // Fast attack (10ms) followed by natural exponential ring decay
      const attack = Math.min(1.0, t / 0.012);
      const decay = Math.exp(-t * (note.freq < 400 ? 1.4 : 1.9));
      const envelope = attack * decay;

      // Authentic tubular bell harmonics with slight detune beating
      const f = note.freq;
      const fDetune = f * 1.002; // Acoustic natural chorus shimmer
      
      // Partials: fundamental, octave, minor 3rd tierce, 4th partial, chime brilliance
      const fundamental = 0.50 * (Math.sin(2 * Math.PI * f * t) + Math.sin(2 * Math.PI * fDetune * t)) * 0.5;
      const octave = 0.28 * Math.sin(2 * Math.PI * (f * 2.0) * t);
      const tierce = 0.18 * Math.sin(2 * Math.PI * (f * 2.76) * t); // Characteristic tubular bell tierce
      const quint = 0.10 * Math.sin(2 * Math.PI * (f * 3.98) * t);
      const shimmer = 0.06 * Math.sin(2 * Math.PI * (f * 5.40) * t);

      // Mallet impact strike at start
      const strikeNoise = t < 0.03 ? (Math.random() * 2 - 1) * Math.exp(-t * 120) * 0.15 : 0;

      const sample = (fundamental + octave + tierce + quint + shimmer + strikeNoise) * envelope;
      samples[startIndex + i] += sample * 0.85;
    }
  }

  // Soft limiter and write to 16-bit PCM buffer
  for (let i = 0; i < numSamples; i++) {
    let s = samples[i];
    // Gentle soft clip
    if (s > 0.95) s = 0.95 + 0.05 * Math.tanh((s - 0.95) / 0.05);
    else if (s < -0.95) s = -0.95 + 0.05 * Math.tanh((s + 0.95) / 0.05);

    const intVal = Math.floor(Math.max(-1, Math.min(1, s)) * 32767);
    pcmBuffer.writeInt16LE(intVal, i * 2);
  }

  // RIFF Header for 44.1kHz 16-bit Mono WAV
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20);  // PCM
  header.writeUInt16LE(1, 22);  // Mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  header.writeUInt16LE(2, 32);  // BlockAlign
  header.writeUInt16LE(16, 34); // BitsPerSample
  header.write('data', 36);
  header.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([header, pcmBuffer]);
}

const publicDir = path.resolve('public');
const audioDir = path.resolve('public/audio');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

// Write PNG icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, 30, 64, 175));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, 30, 64, 175));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, 30, 64, 175));
fs.writeFileSync(path.join(publicDir, 'favicon.png'), createPNG(64, 64, 30, 64, 175));

// Write SVG icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="128" fill="#1E40AF"/>
  <path d="M256 96c-13.3 0-24 10.7-24 24v16.6C180.7 151 144 199.1 144 256v80l-32 32v16h288v-16l-32-32v-80c0-56.9-36.7-105-88-119.4V120c0-13.3-10.7-24-24-24zm-48 320c4.3 27.1 27.8 48 56 48s51.7-20.9 56-48H208z" fill="#FBBF24"/>
  <circle cx="380" cy="132" r="28" fill="#10B981" />
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg);

// Write audio file matching user's bell chime
const bellWav = createRealisticBellWav();
fs.writeFileSync(path.join(audioDir, 'bel.wav'), bellWav);
fs.writeFileSync(path.join(audioDir, 'bel.mp3'), bellWav); // Serves both .wav and .mp3 seamlessly

console.log('Successfully generated assets and realistic school bell audio in public/audio/');
