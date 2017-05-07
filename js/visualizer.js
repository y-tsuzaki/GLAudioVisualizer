/// <reference path="../typings/index.d.ts" />
$(window).on('load', function () {
    // $( () => {
    // $('audio').on('canplay', () => {
    var visualizer = new GLAudioVisualizer.Main($('#canvas-wrapper')[0]);
    visualizer.init();
    var audioController = GLAudioVisualizer.AudioController.instance;
    $('.play-button').on('click', function () {
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
    audioController.onended = function () {
        $('.play-button-play').show();
        $('.play-button-pause').hide();
    };
    setInterval(function () {
        var current = audioController.currentTime;
        var currentText = Math.floor(current / 60) + ':' + pad(Math.floor(current % 60).toString(), 2);
        if (isNaN(current)) {
            currentText = '0:00';
        }
        $('.playback-timeline-time-passed > span').text(currentText);
        var duration = audioController.duration;
        var durationText = Math.floor(duration / 60) + ':' + pad(Math.floor(duration % 60).toString(), 2);
        if (isNaN(duration)) {
            durationText = '0:00';
        }
        $('.playback-timeline-time-dulation > span').text(durationText);
    }, 200);
    setInterval(function () {
        if (!timelineChanging) {
            var current = audioController.currentTime;
            var duration = audioController.duration;
            if (duration === 0) {
                $('input[name="playback-timeline"]').val(0);
            }
            else {
                $('input[name="playback-timeline"]').val(current / duration);
            }
        }
    }, 1000);
    var timelineChanging = false;
    $('input[name="playback-timeline"]').on('mousedown touchstart', function () {
        timelineChanging = true;
    });
    $('input[name="playback-timeline"]').on('mouseup touchend touchcancel', function () {
        timelineChanging = false;
    });
    audioController.volume = 0.5;
    $('input[name="volume"]').on('change', function () {
        audioController.volume = Number($('input[name="volume"]').val());
    });
    $('input[name="playback-timeline"]').on('change', function () {
        var val = $('input[name="playback-timeline"]').val();
        var d = audioController.duration;
        audioController.currentTime = d * val;
    });
});
// });
function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
$(function () {
    calcSpacerHeight();
});
$(window).on('resize', function () {
    calcSpacerHeight();
});
function calcSpacerHeight() {
    var canvasH = window.innerHeight;
    var adjustY = $('#main-music-console').height();
    $('#canvas-spacer').height(canvasH - adjustY);
}
var GLAudioVisualizer;
(function (GLAudioVisualizer) {
    var Main = (function () {
        function Main(canvasWrapper) {
            this._canvasWrapper = canvasWrapper;
        }
        Object.defineProperty(Main.prototype, "renderer", {
            get: function () {
                return this._renderer;
            },
            enumerable: true,
            configurable: true
        });
        Main.prototype.init = function () {
            var _this = this;
            var width = window.innerWidth;
            var height = window.innerHeight;
            // init renderer
            this._renderer = new THREE.WebGLRenderer();
            this._renderer.setClearColor(0x000011);
            this._renderer.setSize(width, height);
            $(this._canvasWrapper).append(this._renderer.domElement);
            // init camera
            var fov = 60;
            var aspect = width / height;
            var near = 1;
            var far = 1000;
            this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
            this._camera.position.set(0, 10.0, 20 + 50 * (1 / aspect));
            this._camera['onResized'] = function (w, h) {
                aspect = w / h;
                _this._camera.aspect = aspect;
                _this._camera.position.set(0, 10.0, 20 + 50 * (1 / aspect));
                _this._camera.updateProjectionMatrix();
            };
            //init scene
            this._scene = new THREE.Scene();
            //init light
            var ambilLight = new THREE.AmbientLight(0x333333);
            this._scene.add(ambilLight);
            var directionalLight = new THREE.DirectionalLight(0xffffff);
            directionalLight.intensity = 2.0;
            directionalLight.position.set(0, 0.7, 0.7);
            this._scene.add(directionalLight);
            //init object
            this.meshes1 = new Array();
            this.meshes2 = new Array();
            this.materials = new Array();
            var length = 128;
            this.meshWrapper = new THREE.Object3D();
            var meshW = 0.5;
            for (var i = 0; i < length; i++) {
                var geometry = new THREE.CubeGeometry(meshW, 1, 2);
                var material1 = new THREE.MeshPhongMaterial({ color: '#FFFFFF' });
                var material2 = new THREE.MeshPhongMaterial();
                this.meshes1[i] = new THREE.Mesh(geometry, material1);
                var geometry2 = new THREE.CubeGeometry(meshW, 1, 2);
                this.meshes2[i] = new THREE.Mesh(geometry2, material2);
                this.materials[i] = material2;
                this.meshes1[i].position.set(i * meshW - (length * meshW / 2), 0, 0);
                this.meshes2[i].position.set(i * meshW - (length * meshW / 2), 0, +2);
                // mesh['onUpdate'] = () => {
                //   mesh.rotation.set(
                //     0,
                //     mesh.rotation.y + .01,
                //     mesh.rotation.z + .01
                //   );
                // };
                this.meshWrapper.add(this.meshes1[i]);
                this.meshWrapper.add(this.meshes2[i]);
            }
            this._scene.add(this.meshWrapper);
            //add grid line
            var interval = 5;
            var max = 20;
            for (var i = 0; i < max + 1; i++) {
                //頂点座標の追加
                var geometry = new THREE.Geometry();
                geometry.vertices.push(new THREE.Vector3(-interval * max / 2, 0, i * interval - (interval * max / 2)));
                geometry.vertices.push(new THREE.Vector3(+interval * max / 2, 0, i * interval - (interval * max / 2)));
                //線オブジェクトの生成
                var line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x000077 }));
                //sceneにlineを追加
                this.meshWrapper.add(line);
            }
            for (var i = 0; i < max + 1; i++) {
                //頂点座標の追加
                var geometry = new THREE.Geometry();
                geometry.vertices.push(new THREE.Vector3(i * interval - (interval * max / 2), 0, -interval * max / 2));
                geometry.vertices.push(new THREE.Vector3(i * interval - (interval * max / 2), 0, +interval * max / 2));
                //線オブジェクトの生成
                var line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x000077 }));
                //sceneにlineを追加
                this.meshWrapper.add(line);
            }
            this.setResizeEvent();
            this.doUpdate();
            var soundUrl = 'sound/EzaOne - Supernova.mp3';
            GLAudioVisualizer.AudioController.instance.init();
            GLAudioVisualizer.AudioController.instance.loadSound(soundUrl, function (buffer) {
                GLAudioVisualizer.AudioController.instance.setBuffer(buffer);
                var context = GLAudioVisualizer.AudioController.instance.context;
                var analyser = context.createAnalyser();
                analyser.minDecibels = -100;
                analyser.maxDecibels = -20;
                _this.analyser = analyser;
                analyser.fftSize = 1024;
                analyser.smoothingTimeConstant = 0.7;
            });
            GLAudioVisualizer.AudioController.instance.onPlaying = function () {
                var src = GLAudioVisualizer.AudioController.instance.source;
                src.connect(_this.analyser);
            };
            // Stats
            /* tslint:disable */
            // tslint:disable-next-line <optional rule identifier>
            this.stats = new Stats(); // tslint:disable-line
            /* tslint:enable */
            document.body.appendChild(this.stats.dom);
        };
        Main.prototype.doUpdate = function () {
            var _this = this;
            if (this.stats) {
                this.stats.begin();
            }
            if (!this.oldUpdateTime) {
                this.oldUpdateTime = new Date().getTime();
            }
            var now = new Date().getTime();
            var delta = now - this.oldUpdateTime;
            this.oldUpdateTime = now;
            if (delta < 0) {
                throw new Error();
            }
            requestAnimationFrame(function () {
                _this.doUpdate();
            });
            if (!this._scene) {
                return;
            }
            this.onUpdate(delta);
            var doUpdateSubRoutine = function (obj) {
                if (obj['onUpdate'] instanceof Function) {
                    obj['onUpdate'](delta);
                }
                for (var _i = 0, _a = obj.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    doUpdateSubRoutine(child);
                }
            };
            doUpdateSubRoutine(this._scene);
            this._renderer.render(this._scene, this._camera);
            if (this.stats) {
                this.stats.end();
            }
        };
        Main.prototype.onUpdate = function (delta) {
            if (!this.analyser) {
                return;
            }
            var count = this.meshes1.length;
            var data = new Uint8Array(count);
            this.analyser.getByteTimeDomainData(data);
            for (var i = 0; i < count; ++i) {
                // console.log('[' + i + ']:' + data[i]);
                var h = data[i] * 0.1 + 0.01;
                this.meshes1[i].scale.setY(h);
            }
            data = new Uint8Array(count);
            this.analyser.getByteFrequencyData(data);
            for (var i = 0; i < count; ++i) {
                // console.log('[' + i + ']:' + data[i]);
                var h = data[i] * (data[i] / 100) * 0.08 + 0.01;
                this.meshes2[i].scale.setY(h);
                var color = new THREE.Color('hsl(' + (i / count * 360) + ', 100%, 50%)').getHex();
                (Object)(this.materials[i]).color.set(color);
            }
            this.meshWrapper.rotation.set(0, this.meshWrapper.rotation.y + (delta / 10000), 0);
        };
        //
        Main.prototype.setResizeEvent = function () {
            var _this = this;
            var doResizeSubRoutine = function (obj, width, height) {
                if (obj['onResized'] instanceof Function) {
                    obj['onResized'](width, height);
                }
                for (var _i = 0, _a = obj.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    doResizeSubRoutine(child, width, height);
                }
            };
            $(window).on('resize', function (e) {
                var w = window.innerWidth;
                var h = window.innerHeight;
                _this._renderer.setSize(w, h);
                if (_this._scene) {
                    doResizeSubRoutine(_this._scene, w, h);
                }
                if (_this._camera) {
                    if (_this._camera['onResized'] instanceof Function) {
                        _this._camera['onResized'](w, h);
                    }
                }
            });
        };
        return Main;
    }());
    GLAudioVisualizer.Main = Main;
})(GLAudioVisualizer || (GLAudioVisualizer = {}));
var GLAudioVisualizer;
(function (GLAudioVisualizer) {
    var CanvasElemID = 'canvas-main';
    var AudioController = (function () {
        function AudioController() {
            this._startAt = 0;
            this._pauseAt = 0;
            this._isPaused = false;
            this._isStopped = true;
            //
        }
        Object.defineProperty(AudioController, "instance", {
            get: function () {
                if (!AudioController._instance) {
                    AudioController._instance = new AudioController();
                }
                return AudioController._instance;
            },
            enumerable: true,
            configurable: true
        });
        AudioController.prototype.init = function () {
            try {
                // Fix up for prefixing
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                this.context = new AudioContext();
                this.gainNode = this.context.createGain();
                this.gainNode.gain.value = 1.0;
                this.gainNode.connect(this.context.destination);
            }
            catch (e) {
                //
            }
        };
        Object.defineProperty(AudioController.prototype, "isPlaying", {
            get: function () {
                return !this._isStopped && !this._isPaused;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AudioController.prototype, "volume", {
            get: function () {
                return this.gainNode.gain.value;
            },
            set: function (val) {
                this.gainNode.gain.value = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AudioController.prototype, "canPlay", {
            get: function () {
                return this._currentBuffer != null;
            },
            enumerable: true,
            configurable: true
        });
        AudioController.prototype.setBuffer = function (buffer) {
            this._currentBuffer = buffer; // tell the source which sound to play
            // Create a gain node.
        };
        AudioController.prototype.loadSound = function (url, onLoad, onError) {
            var _this = this;
            var data;
            var request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.responseType = 'arraybuffer';
            // Decode asynchronously
            request.onload = function () {
                var a;
                _this.context.decodeAudioData(request.response, function (buffer) {
                    onLoad(buffer);
                }, function () {
                    onError(new ErrorEvent(''));
                });
            };
            request.send();
        };
        AudioController.prototype.play = function () {
            var _this = this;
            if (!this._currentBuffer) {
                return;
            }
            this._startAt = new Date().getTime();
            this.source = this.context.createBufferSource(); // creates a sound source
            this.source.buffer = this._currentBuffer;
            this.source.connect(this.gainNode); // play the source now
            this.source.start(0);
            this.source.onended = function () {
                _this._onEndedCallBack();
            };
            this._isPaused = false;
            this._isStopped = false;
            if (this.onPlaying) {
                this.onPlaying();
            }
        };
        AudioController.prototype._onEndedCallBack = function () {
            var currentTime = new Date().getTime() - this._startAt;
            if (currentTime / 1000 < this.source.buffer.duration) {
                return;
            }
            this.stop();
            if (onended != null) {
                this.onended();
            }
        };
        AudioController.prototype.stop = function () {
            this.source.stop();
            this._isStopped = true;
        };
        AudioController.prototype.resume = function () {
            var _this = this;
            if (this._isStopped) {
                this.play();
                return;
            }
            if (!this._isPaused) {
                return;
            }
            this.source = this.context.createBufferSource(); // creates a sound source
            this.source.buffer = this._currentBuffer;
            this.source.onended = function () {
                _this._onEndedCallBack();
            };
            this.source.connect(this.gainNode); // play the source now
            var currentTime = this._pauseAt - this._startAt;
            this._startAt = new Date().getTime() - currentTime;
            this.source.start(0, currentTime / 1000);
            this._isPaused = false;
            if (this.onPlaying) {
                this.onPlaying();
            }
        };
        AudioController.prototype.pause = function () {
            if (this._isStopped) {
                return;
            }
            if (this._isPaused) {
                return;
            }
            this.source.stop();
            this._pauseAt = new Date().getTime();
            var currentTime = this._pauseAt - this._startAt;
            this._startAt = this._pauseAt - currentTime;
            this._isPaused = true;
        };
        Object.defineProperty(AudioController.prototype, "duration", {
            get: function () {
                if (!this.source || !this.source.buffer) {
                    return 0;
                }
                return this.source.buffer.duration;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AudioController.prototype, "currentTime", {
            get: function () {
                if (this._isStopped) {
                    return 0;
                }
                if (this._isPaused) {
                    return (this._pauseAt - this._startAt) / 1000;
                }
                return (new Date().getTime() - this._startAt) / 1000;
            },
            set: function (sec) {
                var doResume = false;
                if (this.isPlaying) {
                    this.pause();
                    doResume = true;
                }
                this._startAt = new Date().getTime() - sec * 1000;
                this._pauseAt = new Date().getTime();
                if (doResume) {
                    this.resume();
                }
            },
            enumerable: true,
            configurable: true
        });
        AudioController.prototype.playSound = function (buffer) {
            // note: on older systems, may have to use deprecated noteOn(time);
        };
        return AudioController;
    }());
    GLAudioVisualizer.AudioController = AudioController;
})(GLAudioVisualizer || (GLAudioVisualizer = {}));
//# sourceMappingURL=visualizer.js.map