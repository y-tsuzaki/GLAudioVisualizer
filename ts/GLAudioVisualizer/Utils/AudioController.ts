
namespace GLAudioVisualizer {
  const CanvasElemID: String = 'canvas-main';
  export class AudioController {
    private static _instance: AudioController;

    public static get instance() : AudioControllerss {
      if (!AudioController._instance) {
        AudioController._instance = new AudioController();
      }
      return AudioController._instance;
    }

    public constructor() {
      //
    }

    public context: AudioContext;

    public loadSound(url: string, onLoad: (buffer: ArrayBuffer) => void, onError?: (error: ErrorEvent) => void): void {
      //
      try {
        // Fix up for prefixing
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();
      } catch (e) {
        onError(e);
      }

      let data: ArrayBuffer;
      let request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.responseType = 'arraybuffer';

      // Decode asynchronously
      request.onload = () => {
        let a: DecodeSuccessCallback;
        this.context.decodeAudioData(request.response, (buffer) => {
          onLoad(buffer);
        }, () => {
          onError(new ErrorEvent(''));
        });
      };

      request.send();
    }

    public source: BufferSource;
    public playSound(buffer: ArrayBuffer) : void {
      this.source = this.context.createBufferSource(); // creates a sound source
      this.source.buffer = buffer;                    // tell the source which sound to play
      // this.source.connect(this.context.destination);       // connect the source to the context's destination (the speakers)
      // Create a gain node.
      let gainNode = this.context.createGain();
      // Connect the source to the gain node.
      this.source.connect(gainNode);
      // Connect the gain node to the destination.
      gainNode.connect(this.context.destination);
      gainNode.gain.value = 0.5;
      this.source.start(0);                           // play the source now
                                                 // note: on older systems, may have to use deprecated noteOn(time);
    }
  }
}
