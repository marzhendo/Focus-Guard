// noise.js - Web Audio API Ambient Sound Synthesizer

window.FocusEnvironment = {
  audioContext: null,
  noiseNode: null,
  gainNode: null,
  filterNode: null,
  isPlaying: false,

  init: function() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  createNoiseBuffer: function() {
    const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds of noise
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  },

  play: function(type, volumeLevel) {
    this.stop();
    this.init();

    if (type === "None") return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const bufferSize = this.audioContext.sampleRate * 2;
    this.noiseNode = this.audioContext.createBufferSource();
    this.noiseNode.buffer = this.createNoiseBuffer();
    this.noiseNode.loop = true;

    this.filterNode = this.audioContext.createBiquadFilter();
    this.gainNode = this.audioContext.createGain();

    if (type === "Pink Noise") {
      this.filterNode.type = "lowpass";
      this.filterNode.frequency.value = 1000;
      this.filterNode.Q.value = 0.5;
    } else if (type === "Brown Noise") {
      this.filterNode.type = "lowpass";
      this.filterNode.frequency.value = 400;
      this.filterNode.Q.value = 0.5;
    }

    this.setVolume(volumeLevel);

    this.noiseNode.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    this.noiseNode.start(0);
    this.isPlaying = true;
  },

  setVolume: function(level) {
    if (this.gainNode) {
      // level is 0-100, scale it to 0-1 logarithmically or linearly. Linear is fine for ambient.
      // Maximum volume for noise should be capped so it's not too loud (e.g. 0.3)
      const maxGain = 0.3;
      this.gainNode.gain.value = (level / 100) * maxGain;
    }
  },

  stop: function() {
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
      } catch (e) {}
      this.noiseNode.disconnect();
      this.noiseNode = null;
    }
    if (this.filterNode) {
      this.filterNode.disconnect();
      this.filterNode = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    this.isPlaying = false;
  },

  suspend: function() {
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
  },

  resume: function() {
    if (this.audioContext && this.audioContext.state === 'suspended' && this.isPlaying) {
      this.audioContext.resume();
    }
  }
};
