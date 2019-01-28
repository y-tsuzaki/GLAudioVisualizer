
namespace GLAudioVisualizer {
  const CanvasElemID: String = 'canvas-main';
  export class AudioController {

    public constructor() {
      this._init();
    }

    private _init() : void {
      try {
        (<any>window).AudioContext = (<any>window).AudioContext | (<any>window).webkitAudioContext;
        this.context = new AudioContext();
        this.gainNode = this.context.createGain();
        this.gainNode.gain.value = 1.0;
        this.gainNode.connect(this.context.destination);
      } catch (e) {
        throw e;
      }
    }

    public get isPlaying(): boolean {
      return !this._isStopped && !this._isPaused;
    }

    public set volume(val: number) {
      this.gainNode.gain.value = val;
    }
    public get volume(): number {
      return this.gainNode.gain.value;
    }
    public get canPlay() : boolean {
      return this._currentBuffer != null;
    }

    public onPlaying: () => void;

    private _currentBuffer: AudioBuffer;
    public setBuffer(buffer: AudioBuffer) : void {
        this._currentBuffer = buffer;                    // tell the source which sound to play
        // Create a gain node.
    }

    public context: AudioContext;

    public loadSound(url: string, onLoad: (buffer: AudioBuffer) => void, onError?: (error: ErrorEvent) => void): void {
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

    private _startAt: number = 0;
    private _pauseAt: number = 0;
    private _isPaused: boolean = false;
    private _isStopped: boolean = true;
    public play() : void {
      if (!this._currentBuffer) {
        return;
      }
      this._startAt = new Date().getTime();
      this.source = this.context.createBufferSource(); // creates a sound source
      this.source.buffer = this._currentBuffer;
      this.source.connect(this.gainNode);                          // play the source now
      this.source.start(0);
      this.source.onended = () => {
        this._onEndedCallBack();
      };

      this._isPaused = false;
      this._isStopped = false;

      if (this.onPlaying) {
        this.onPlaying();
      }
    }

    private _onEndedCallBack(): void {
      let currentTime = new Date().getTime() - this._startAt;
      if ( currentTime / 1000 < this.source.buffer.duration) {
        return;
      }
      this.stop();
      if (onended != null) {
        this.onended();
      }
    }

    public onended: () => void;

    public stop() : void {
      this.source.stop();
      this._isStopped = true;
    }

    public resume() : void {
      if (this._isStopped) {
        this.play();
        return;
      }
      if (!this._isPaused) {
        return;
      }

      this.source = this.context.createBufferSource(); // creates a sound source
      this.source.buffer = this._currentBuffer;
      this.source.onended = () => {
        this._onEndedCallBack();
      };
      this.source.connect(this.gainNode);                          // play the source now
      let currentTime = this._pauseAt - this._startAt;
      this._startAt = new Date().getTime() - currentTime;
      this.source.start(0, currentTime / 1000);
      this._isPaused = false;

      if (this.onPlaying) {
        this.onPlaying();
      }
    }

    public pause() : void {
      if (this._isStopped) {
        return;
      }
      if (this._isPaused) {
        return;
      }
      this.source.stop();

      this._pauseAt = new Date().getTime();
      let currentTime = this._pauseAt - this._startAt;
      this._startAt = this._pauseAt - currentTime;
      this._isPaused = true;
    }

    public get duration(): number {
      if (!this.source || !this.source.buffer) {
        return 0;
      }
      return this.source.buffer.duration;
    }

    public get currentTime(): number {
      if (this._isStopped) {
        return 0;
      }
      if (this._isPaused) {
        return (this._pauseAt - this._startAt) / 1000;
      }
      return (new Date().getTime() - this._startAt) / 1000;
    }

    public set currentTime(sec: number) {
      let doResume = false;
      if (this.isPlaying) {
        this.pause();
        doResume = true;
      }

      this._startAt = new Date().getTime() - sec * 1000;
      this._pauseAt = new Date().getTime();
      if (doResume) {
        this.resume();
      }
    }
    public source: AudioBufferSourceNode;
    public gainNode: GainNode;

    public playSound(buffer: AudioBuffer) : void {
                                                 // note: on older systems, may have to use deprecated noteOn(time);
    }
  }
}
