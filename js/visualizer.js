/// <reference path="../typings/index.d.ts" />
$(window).on('load', function () {
    var visualizer = GLAudioVisualizer.Main.instance;
    visualizer.init();
});
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
            this._renderer.setClearColor(0x000011);
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
            this._camera.position.setY(10.0);
            //init scene
            this._scene = new THREE.Scene();
            //init light
            var directionalLight = new THREE.AmbientLight(0xffffff);
            // directionalLight.position.set( 0, 0.7, 0.7 );
            this._scene.add(directionalLight);
            //init object
            this.meshes = new Array();
            this.meshWrapper = new THREE.Object3D();
            for (var i = 0; i < 128; i++) {
                var geometry = new THREE.CubeGeometry(0.5, 1, 2);
                var colorRGB = GLAudioVisualizer.Color.HSVtoRGB(i / 128, 0.5, 0.5);
                var color = new THREE.Color('hsl(' + (i / 128 * 360) + ', 100%, 50%)').getHex();
                var material = new THREE.MeshPhongMaterial({ color: color });
                this.meshes[i] = new THREE.Mesh(geometry, material);
                this.meshes[i].position.set(i * 0.5 - 64 / 2, -30, 0);
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
            //add glid line
            var interval = 2;
            var max = 100;
            for (var i = 0; i < max; i++) {
                //頂点座標の追加
                var geometry = new THREE.Geometry();
                geometry.vertices.push(new THREE.Vector3(-interval * max / 2, 0, i * interval - (interval * max / 2)));
                geometry.vertices.push(new THREE.Vector3(+interval * max / 2, 0, i * interval - (interval * max / 2)));
                //線オブジェクトの生成
                var line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x000099 }));
                //sceneにlineを追加
                this.meshWrapper.add(line);
            }
            for (var i = 0; i < max; i++) {
                //頂点座標の追加
                var geometry = new THREE.Geometry();
                geometry.vertices.push(new THREE.Vector3(i * interval - (interval * max / 2), 0, -interval * max / 2));
                geometry.vertices.push(new THREE.Vector3(i * interval - (interval * max / 2), 0, +interval * max / 2));
                //線オブジェクトの生成
                var line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x000099 }));
                //sceneにlineを追加
                this.meshWrapper.add(line);
            }
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
                analyser.smoothingTimeConstant = 0.8;
            });
            // Stats
            this.stats = new Stats();
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
            var count = this.meshes.length;
            var data = new Uint8Array(count);
            this.analyser.getByteFrequencyData(data);
            for (var i = 0; i < count; ++i) {
                // console.log('[' + i + ']:' + data[i]);
                var h = data[i] * (data[i] / 100) * 0.05 + 0.01;
                this.meshes[i].scale.setY(h);
                this.meshes[i].position.setY(h / 2);
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
                var a;
                _this.context.decodeAudioData(request.response, function (buffer) {
                    onLoad(buffer);
                }, function () {
                    onError(new ErrorEvent(''));
                });
            };
            request.send();
        };
        AudioController.prototype.playSound = function (buffer) {
            this.source = this.context.createBufferSource(); // creates a sound source
            this.source.buffer = buffer; // tell the source which sound to play
            // this.source.connect(this.context.destination);       // connect the source to the context's destination (the speakers)
            // Create a gain node.
            var gainNode = this.context.createGain();
            // Connect the source to the gain node.
            this.source.connect(gainNode);
            // Connect the gain node to the destination.
            gainNode.connect(this.context.destination);
            gainNode.gain.value = 0.5;
            this.source.start(0); // play the source now
            // note: on older systems, may have to use deprecated noteOn(time);
        };
        return AudioController;
    }());
    GLAudioVisualizer.AudioController = AudioController;
})(GLAudioVisualizer || (GLAudioVisualizer = {}));
var GLAudioVisualizer;
(function (GLAudioVisualizer) {
    var Color = (function () {
        function Color() {
        }
        /**
         * HSV配列 を RGB配列 へ変換します
         *
         * @param   {Number}  h         hue値        ※ 0～360の数値
         * @param   {Number}  s         saturation値 ※ 0～255 の数値
         * @param   {Number}  v         value値      ※ 0～255 の数値
         * @return  {Object}  {r, g, b} ※ r/g/b は 0～255 の数値
         */
        Color.HSVtoRGB = function (h, s, v) {
            var r;
            var g;
            var b; // 0..255
            while (h < 0) {
                h += 360;
            }
            h = h % 360;
            // 特別な場合 saturation = 0
            if (s === 0) {
                // → RGB は V に等しい
                v = Math.round(v);
                return { 'r': v, 'g': v, 'b': v };
            }
            s = s / 255;
            var i = Math.floor(h / 60) % 6;
            var f = (h / 60) - i;
            var p = v * (1 - s);
            var q = v * (1 - f * s);
            var t = v * (1 - (1 - f) * s);
            switch (i) {
                case 0:
                    r = v;
                    g = t;
                    b = p;
                    break;
                case 1:
                    r = q;
                    g = v;
                    b = p;
                    break;
                case 2:
                    r = p;
                    g = v;
                    b = t;
                    break;
                case 3:
                    r = p;
                    g = q;
                    b = v;
                    break;
                case 4:
                    r = t;
                    g = p;
                    b = v;
                    break;
                case 5:
                    r = v;
                    g = p;
                    b = q;
                    break;
                default:
                    throw new Error();
            }
            return { 'r': Math.round(r), 'g': Math.round(g), 'b': Math.round(b) };
        };
        return Color;
    }());
    GLAudioVisualizer.Color = Color;
})(GLAudioVisualizer || (GLAudioVisualizer = {}));
//# sourceMappingURL=visualizer.js.map