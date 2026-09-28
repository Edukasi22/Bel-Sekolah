import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, r, g, b, iconType = 'bell') {
  // Simple PNG encoder using node zlib
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

      // School bell icon aesthetic: Royal Blue background (#1E40AF) with golden yellow bell (#FBBF24)
      if (dist < radius) {
        // Inside rounded badge circle
        // Simple bell shape test
        const bellY = (y - cy) / (radius * 0.7);
        const bellX = (x - cx) / (radius * 0.7);
        
        let isBell = false;
        // Bell body
        if (bellY >= -0.6 && bellY <= 0.4) {
          const bellWidthAtY = 0.2 + 0.45 * Math.pow((bellY + 0.6), 1.6);
          if (Math.abs(bellX) <= bellWidthAtY) {
            isBell = true;
          }
        }
        // Bell rim
        if (bellY > 0.4 && bellY <= 0.6 && Math.abs(bellX) <= 0.65) {
          isBell = true;
        }
        // Bell clapper
        if (bellY > 0.6 && bellY <= 0.8 && Math.sqrt(bellX * bellX + (bellY - 0.7) * (bellY - 0.7)) <= 0.18) {
          isBell = true;
        }
        // Bell top loop
        if (bellY < -0.6 && bellY >= -0.8 && Math.sqrt(bellX * bellX + (bellY + 0.7) * (bellY + 0.7)) <= 0.18) {
          isBell = true;
        }

        if (isBell) {
          // Gold / Yellow #FBBF24
          buffer[idx] = 251;     // R
          buffer[idx + 1] = 191; // G
          buffer[idx + 2] = 36;  // B
          buffer[idx + 3] = 255; // A
        } else {
          // Royal Blue #1E40AF
          buffer[idx] = 30;      // R
          buffer[idx + 1] = 64;  // G
          buffer[idx + 2] = 175; // B
          buffer[idx + 3] = 255; // A
        }
      } else {
        // Outside circle: transparent or background
        buffer[idx] = 30;
        buffer[idx + 1] = 64;
        buffer[idx + 2] = 175;
        buffer[idx + 3] = 0; // Transparent
      }
    }
  }

  // Construct raw uncompressed scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  let srcOffset = 0;
  let dstOffset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[dstOffset++] = 0; // Filter None
    buffer.copy(scanlines, dstOffset, srcOffset, srcOffset + width * 4);
    dstOffset += width * 4;
    srcOffset += width * 4;
  }

  const compressedData = zlib.deflateSync(scanlines);

  // PNG Signature
  const pngSig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA (6)
  ihdrData[10] = 0; // Compression: 0
  ihdrData[11] = 0; // Filter: 0
  ihdrData[12] = 0; // Interlace: 0

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

  // CRC32 table
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

// Generate CRC table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

// Generate simple 4-chime Westminster wav file (PCM 16-bit 44.1kHz mono)
function createChimeWav() {
  const sampleRate = 44100;
  // Notes: E4 (329.63Hz), G#4 (415.30Hz), F#4 (369.99Hz), B3 (246.94Hz)
  const notes = [
    { freq: 659.25, dur: 0.7 }, // E5
    { freq: 554.37, dur: 0.7 }, // C#5
    { freq: 493.88, dur: 0.7 }, // B4
    { freq: 329.63, dur: 1.2 }, // E4
  ];

  const totalDuration = notes.reduce((sum, n) => sum + n.dur, 0) + 0.5;
  const numSamples = Math.floor(sampleRate * totalDuration);
  const pcmBuffer = Buffer.alloc(numSamples * 2);

  let currentSample = 0;
  for (const note of notes) {
    const noteSamples = Math.floor(sampleRate * note.dur);
    for (let i = 0; i < noteSamples; i++) {
      const t = i / sampleRate;
      // Exponential decay
      const env = Math.exp(-t * 2.5);
      // Bell harmonic richness: fundamental + 2nd harmonic + 3rd harmonic
      const val = 0.6 * Math.sin(2 * Math.PI * note.freq * t) +
                  0.3 * Math.sin(2 * Math.PI * note.freq * 2.0 * t) +
                  0.15 * Math.sin(2 * Math.PI * note.freq * 3.0 * t);
      const sampleVal = Math.max(-1, Math.min(1, val * env * 0.8));
      const intVal = Math.floor(sampleVal * 32767);
      if (currentSample < numSamples) {
        pcmBuffer.writeInt16LE(intVal, currentSample * 2);
        currentSample++;
      }
    }
  }

  // RIFF Header
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32BE(36 + pcmBuffer.length, 4); // Little endian needed
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  header.writeUInt16LE(1, 22);  // NumChannels (1 = Mono)
  header.writeUInt32LE(sampleRate, 24); // SampleRate
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

// Write audio file
const wavData = createChimeWav();
fs.writeFileSync(path.join(audioDir, 'bel.wav'), wavData);
fs.writeFileSync(path.join(audioDir, 'bel.mp3'), wavData); // Many browsers handle audio/mpeg and audio/wav interchangeable via Audio()

console.log('Successfully generated assets in public/');
