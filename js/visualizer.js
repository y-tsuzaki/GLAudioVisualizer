var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/// <reference path="../typings/index.d.ts" />
$(window).on('load', function () {
    var visualizer = GLAudioVisualizer.Main.instance;
    visualizer.init();
});
/// <reference path="../../typings/index.d.ts" />
var core;
(function (core) {
    var Director = (function () {
        function Director() {
            //
        }
        Director.prototype.init = function (canvasWrapper) {
            // Init Game
        };
        Director.prototype.start = function () {
            // Start Game
        };
        return Director;
    }());
    core.Director = Director;
})(core || (core = {}));
/// <reference path="../../typings/index.d.ts" />
var core;
(function (core) {
    var Scene = (function (_super) {
        __extends(Scene, _super);
        function Scene() {
            return _super.call(this) || this;
        }
        return Scene;
    }(THREE.Scene));
    core.Scene = Scene;
})(core || (core = {}));
var GLAudioVisualizer;
(function (GLAudioVisualizer) {
    var CanvasElemID = 'canvas-main';
    var Main = (function () {
        function Main() {
        }
        Object.defineProperty(Main, "instance", {
            get: function () {
                if (!Main.__instance) {
                    Main.__instance = new Main();
                }
                return Main.__instance;
            },
            enumerable: true,
            configurable: true
        });
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
            this._renderer.setClearColor(0x9999BB);
            this._renderer.setSize(width, height);
            $('#canvas-wrapper').append(this._renderer.domElement);
            // init camera
            var fov = 60;
            var aspect = width / height;
            var near = 1;
            var far = 1000;
            this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
            this._camera.position.set(0, 0, 50);
            this._camera['onResized'] = function (w, h) {
                _this._camera.aspect = w / h;
                _this._camera.updateProjectionMatrix();
            };
            //init scene
            this._scene = new THREE.Scene();
            //init light
            var directionalLight = new THREE.DirectionalLight(0xffffff);
            directionalLight.position.set(0, 0.7, 0.7);
            this._scene.add(directionalLight);
            //init object
            this.meshes = new Array();
            this.meshWrapper = new THREE.Object3D();
            for (var i = 0; i < 64; i++) {
                var geometry = new THREE.CubeGeometry(0.9, 1, 1);
                var material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
                this.meshes[i] = new THREE.Mesh(geometry, material);
                this.meshes[i].position.set(i - 64 / 2, -30, 0);
                // mesh['onUpdate'] = () => {
                //   mesh.rotation.set(
                //     0,
                //     mesh.rotation.y + .01,
                //     mesh.rotation.z + .01
                //   );
                // };
                this.meshWrapper.add(this.meshes[i]);
            }
            this._scene.add(this.meshWrapper);
            this.setResizeEvent();
            this.doUpdate();
            var soundUrl = 'sound/electric-mantis-daybreak.mp3';
            GLAudioVisualizer.AudioController.instance.loadSound(soundUrl, function (buffer) {
                GLAudioVisualizer.AudioController.instance.playSound(buffer);
                var context = GLAudioVisualizer.AudioController.instance.context;
                var src = GLAudioVisualizer.AudioController.instance.source;
                var analyser = context.createAnalyser();
                analyser.minDecibels = -100;
                analyser.maxDecibels = -20;
                _this.analyser = analyser;
                src.connect(analyser);
                analyser.fftSize = 1024;
                analyser.smoothingTimeConstant = 0.7;
            });
        };
        Main.prototype.doUpdate = function () {
            var _this = this;
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
        };
        Main.prototype.onUpdate = function (delta) {
            if (!this.analyser) {
                return;
            }
            var count = this.meshes.length;
            var data = new Uint8Array(count);
            this.analyser.getByteFrequencyData(data);
            for (var i = 0; i < count; ++i) {
                // console.log('[' + i + ']:' + data[i]);
                var h = data[i] * 0.05 + 0.01;
                this.meshes[i].scale.setY(h);
                this.meshes[i].position.setY(h / 2 - 10);
            }
            console.log(delta);
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
        AudioController.prototype.loadSound = function (url, onLoad, onError) {
            var _this = this;
            //
            try {
                // Fix up for prefixing
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                this.context = new AudioContext();
            }
            catch (e) {
                onError(e);
            }
            var data;
            var request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.responseType = 'arraybuffer';
            // Decode asynchronously
            request.onload = function () {
                _this.context.decodeAudioData(request.response, function (buffer) {
                    onLoad(buffer);
                }, onError);
            };
            request.send();
        };
        AudioController.prototype.playSound = function (buffer) {
            this.source = this.context.createBufferSource(); // creates a sound source
            this.source.buffer = buffer; // tell the source which sound to play
            this.source.connect(this.context.destination); // connect the source to the context's destination (the speakers)
            this.source.start(0); // play the source now
            // note: on older systems, may have to use deprecated noteOn(time);
        };
        return AudioController;
    }());
    GLAudioVisualizer.AudioController = AudioController;
})(GLAudioVisualizer || (GLAudioVisualizer = {}));
//# sourceMappingURL=visualizer.js.map