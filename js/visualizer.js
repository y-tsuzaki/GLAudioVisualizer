$(window).on('load', () => {
    let visualizer = new GLAudioVisualizer($('#canvas-wrapper')[0]);
    visualizer.init();
    let audioController = visualizer.audioController;
    $('.play-button').on('click', () => {
        if (!audioController.canPlay) {
            alert('ロードが終わっていない可能性があります。しばらくお待ちください');
            return;
        }
        if (!audioController.isPlaying) {
            audioController.resume();
            $('.play-button-play').hide();
            $('.play-button-pause').show();
        }
        else {
            audioController.pause();
            $('.play-button-play').show();
            $('.play-button-pause').hide();
        }
    });
    audioController.onended = () => {
        $('.play-button-play').show();
        $('.play-button-pause').hide();
    };
    setInterval(() => {
        let current = audioController.currentTime;
        let currentText = Math.floor(current / 60) + ':' + pad(Math.floor(current % 60).toString(), 2);
        if (isNaN(current)) {
            currentText = '0:00';
        }
        $('.playback-timeline-time-passed > span').text(currentText);
        let duration = audioController.duration;
        let durationText = Math.floor(duration / 60) + ':' + pad(Math.floor(duration % 60).toString(), 2);
        if (isNaN(duration)) {
            durationText = '0:00';
        }
        $('.playback-timeline-time-dulation > span').text(durationText);
    }, 200);
    setInterval(() => {
        if (!timelineChanging) {
            let current = audioController.currentTime;
            let duration = audioController.duration;
            if (duration === 0) {
                $('input[name="playback-timeline"]').val(0);
            }
            else {
                $('input[name="playback-timeline"]').val(current / duration);
            }
        }
    }, 1000);
    let timelineChanging = false;
    $('input[name="playback-timeline"]').on('mousedown touchstart', () => {
        timelineChanging = true;
    });
    $('input[name="playback-timeline"]').on('mouseup touchend touchcancel', () => {
        timelineChanging = false;
    });
    audioController.volume = 0.5;
    $('input[name="volume"]').on('input', () => {
        audioController.volume = Number($('input[name="volume"]').val());
    });
    $('input[name="playback-timeline"]').on('change', () => {
        let val = Number($('input[name="playback-timeline"]').val());
        let d = audioController.duration;
        audioController.currentTime = d * val;
    });
});
function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
class GLAudioVisualizer {
    constructor(canvasWrapper) {
        this._canvasWrapper = canvasWrapper;
    }
    get renderer() {
        return this._renderer;
    }
    get audioController() {
        return this._audioController;
    }
    init() {
        this._renderer = new THREE.WebGLRenderer({ antialias: true });
        this._renderer.setClearColor(0x000011);
        var pixelRatio = window.devicePixelRatio;
        this._renderer.setSize(window.innerWidth, window.innerHeight);
        this._renderer.setPixelRatio(pixelRatio);
        this._renderer.toneMapping = THREE.ReinhardToneMapping;
        $(this._canvasWrapper).append(this._renderer.domElement);
        this._composer = new THREE.EffectComposer(this._renderer);
        var params = {
            exposure: 1,
            bloomStrength: 1.0,
            bloomThreshold: 0,
            bloomRadius: 0
        };
        var bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.renderToScreen = true;
        bloomPass.threshold = params.bloomThreshold;
        bloomPass.strength = params.bloomStrength;
        bloomPass.radius = params.bloomRadius;
        let fov = 60;
        let near = 1;
        let far = 1000;
        let aspect = window.innerWidth / window.innerHeight;
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(0, 20, 40);
        this._camera['onResized'] = (w, h) => {
            let aspect = w / h;
            this._camera.aspect = aspect;
            this._camera.updateProjectionMatrix();
        };
        this._scene = new THREE.Scene();
        this._scene.fog = new THREE.FogExp2(0x000022, 0.002);
        var renderPass = new THREE.RenderPass(this._scene, this._camera);
        this._composer.setSize(window.innerWidth, window.innerHeight);
        this._composer.addPass(renderPass);
        this._composer.addPass(bloomPass);
        this._controls = new THREE.OrbitControls(this._camera, this._renderer.domElement);
        this._controls.enableDamping = true;
        this._controls.dampingFactor = 0.25;
        this._controls.screenSpacePanning = false;
        this._controls.minDistance = 10;
        this._controls.maxDistance = 500;
        this._controls.maxPolarAngle = Math.PI / 2;
        this._controls.target.set(0, 5, 0);
        let ambilLight = new THREE.AmbientLight(0xCCCCCC);
        this._scene.add(ambilLight);
        this._graphMeshes = new Array();
        let length = 64;
        this._graphMeshWrapper = new THREE.Object3D();
        let meshW = 0.5;
        for (let i = 0; i < length; i++) {
            let material = new THREE.MeshPhongMaterial();
            let geometry = new THREE.CubeGeometry(meshW, 1, 2);
            this._graphMeshes[i] = new THREE.Mesh(geometry, material);
            this._graphMeshes[i].position.set(i * (meshW * 2) - (length * (meshW * 2) / 2), 0, +2);
            this._graphMeshWrapper.add(this._graphMeshes[i]);
        }
        this._scene.add(this._graphMeshWrapper);
        let interval = 5;
        let max = 20;
        for (let i = 0; i < max + 1; i++) {
            let geometry = new THREE.Geometry();
            geometry.vertices.push(new THREE.Vector3(-interval * max / 2, 0, i * interval - (interval * max / 2)));
            geometry.vertices.push(new THREE.Vector3(+interval * max / 2, 0, i * interval - (interval * max / 2)));
            let line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x000077 }));
            this._graphMeshWrapper.add(line);
        }
        for (let i = 0; i < max + 1; i++) {
            let geometry = new THREE.Geometry();
            geometry.vertices.push(new THREE.Vector3(i * interval - (interval * max / 2), 0, -interval * max / 2));
            geometry.vertices.push(new THREE.Vector3(i * interval - (interval * max / 2), 0, +interval * max / 2));
            let line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x000077 }));
            this._graphMeshWrapper.add(line);
        }
        this.setResizeEvent();
        this.doUpdate();
        let soundUrl = 'sound/EzaOne - Supernova.mp3';
        this._audioController = new AudioController();
        this._audioController.loadSound(soundUrl, (buffer) => {
            $("#loading-panel").hide();
            this._audioController.setBuffer(buffer);
            let context = this._audioController.context;
            this._analyser = context.createAnalyser();
            this._analyser.minDecibels = -100;
            this._analyser.maxDecibels = -20;
            this._analyser.fftSize = 1024;
            this._analyser.smoothingTimeConstant = 0.2;
        });
        this._audioController.onPlaying = () => {
            let src = this._audioController.source;
            src.connect(this._analyser);
        };
        this._stats = new Stats();
        document.body.appendChild(this._stats.dom);
    }
    doUpdate() {
        if (this._stats) {
            this._stats.begin();
        }
        if (!this._oldUpdateTime) {
            this._oldUpdateTime = new Date().getTime();
        }
        let now = new Date().getTime();
        let delta = now - this._oldUpdateTime;
        this._oldUpdateTime = now;
        if (delta < 0) {
            throw new Error();
        }
        requestAnimationFrame(() => {
            this.doUpdate();
        });
        if (!this._scene) {
            return;
        }
        this.onUpdate(delta);
        let doUpdateSubRoutine = (obj) => {
            if (obj['onUpdate'] instanceof Function) {
                obj['onUpdate'](delta);
            }
            for (let child of obj.children) {
                doUpdateSubRoutine(child);
            }
        };
        doUpdateSubRoutine(this._scene);
        this._composer.render();
        if (this._stats) {
            this._stats.end();
        }
    }
    onUpdate(delta) {
        let count = this._graphMeshes.length;
        let frequencyData = new Uint8Array(count);
        if (this._analyser) {
            this._analyser.getByteFrequencyData(frequencyData);
        }
        for (let i = 0; i < count; ++i) {
            let h = frequencyData[i] * 0.1 + 0.00001;
            this._graphMeshes[i].scale.setY(h);
            this._graphMeshes[i].position.setY(h / 2 + 0.001);
            let color = new THREE.Color('hsl(' + (frequencyData[i] / 255 * 360) + ', 70%, ' + 50 + '%)').getHex();
            this._graphMeshes[i].material.color.set(color);
        }
        this._controls.update();
    }
    setResizeEvent() {
        let doResizeSubRoutine = (obj, width, height) => {
            if (obj['onResized'] instanceof Function) {
                obj['onResized'](width, height);
            }
            for (let child of obj.children) {
                doResizeSubRoutine(child, width, height);
            }
        };
        $(window).on('resize', (e) => {
            let w = window.innerWidth;
            let h = window.innerHeight;
            this._renderer.setSize(w, h);
            this._composer.setSize(w, h);
            if (this._scene) {
                doResizeSubRoutine(this._scene, w, h);
            }
            if (this._camera) {
                if (this._camera['onResized'] instanceof Function) {
                    this._camera['onResized'](w, h);
                }
            }
        });
    }
}
class AudioController {
    constructor() {
        this._startAt = 0;
        this._pauseAt = 0;
        this._isPaused = false;
        this._isStopped = true;
        this._init();
    }
    get isPlaying() {
        return !this._isStopped && !this._isPaused;
    }
    set volume(val) {
        this.gainNode.gain.value = val;
    }
    get volume() {
        return this.gainNode.gain.value;
    }
    get canPlay() {
        return this._currentBuffer != null;
    }
    _init() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();
            this.gainNode = this.context.createGain();
            this.gainNode.gain.value = 1.0;
            this.gainNode.connect(this.context.destination);
        }
        catch (e) {
            throw e;
        }
    }
    setBuffer(buffer) {
        this._currentBuffer = buffer;
    }
    loadSound(url, onLoad, onError) {
        let request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.onload = () => {
            let a;
            this.context.decodeAudioData(request.response, (buffer) => {
                onLoad(buffer);
            }, () => {
                onError(new ErrorEvent(''));
            });
        };
        request.send();
    }
    play() {
        if (!this._currentBuffer) {
            return;
        }
        this._startAt = new Date().getTime();
        this.source = this.context.createBufferSource();
        this.source.buffer = this._currentBuffer;
        this.source.connect(this.gainNode);
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
    _onEndedCallBack() {
        let currentTime = new Date().getTime() - this._startAt;
        if (currentTime / 1000 < this.source.buffer.duration) {
            return;
        }
        this.stop();
        if (onended != null) {
            this.onended();
        }
    }
    stop() {
        this.source.stop();
        this._isStopped = true;
    }
    resume() {
        if (this._isStopped) {
            this.play();
            return;
        }
        if (!this._isPaused) {
            return;
        }
        this.source = this.context.createBufferSource();
        this.source.buffer = this._currentBuffer;
        this.source.onended = () => {
            this._onEndedCallBack();
        };
        this.source.connect(this.gainNode);
        let currentTime = this._pauseAt - this._startAt;
        this._startAt = new Date().getTime() - currentTime;
        this.source.start(0, currentTime / 1000);
        this._isPaused = false;
        if (this.onPlaying) {
            this.onPlaying();
        }
    }
    pause() {
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
    get duration() {
        if (!this.source || !this.source.buffer) {
            return 0;
        }
        return this.source.buffer.duration;
    }
    get currentTime() {
        if (this._isStopped) {
            return 0;
        }
        if (this._isPaused) {
            return (this._pauseAt - this._startAt) / 1000;
        }
        return (new Date().getTime() - this._startAt) / 1000;
    }
    set currentTime(sec) {
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
}
