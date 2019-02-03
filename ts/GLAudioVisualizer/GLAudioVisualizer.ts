class GLAudioVisualizer {

  private _canvasWrapper: HTMLElement;
  public constructor(canvasWrapper: HTMLElement) {
    this._canvasWrapper = canvasWrapper;
  }

  private _renderer: THREE.WebGLRenderer;
  public get renderer(): THREE.WebGLRenderer {
    return this._renderer;
  }
  private _composer: THREE.EffectComposer;
  private _camera: THREE.PerspectiveCamera;
  private _scene: THREE.Scene;
  private _controls: THREE.OrbitControls;

  public graphMeshes: Array<THREE.Object3D>;
  public graphMaterials: Array<THREE.Material>;
  public graphMeshWrapper: THREE.Object3D;

  public audioController: AudioController;
  public stats: Stats;

  private analyser: AnalyserNode;
  private oldUpdateTime: number;

  public init(): void {
    // init renderer
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

    // init camera
    let fov = 60;
    let near = 1;
    let far = 1000;
    let aspect = window.innerWidth / window.innerHeight;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(0, 20, 40);
    this._camera['onResized'] = (w: number, h: number) => {
      let aspect = w / h;
      this._camera.aspect = aspect;
      this._camera.updateProjectionMatrix();
    };
    //init scene
    this._scene = new THREE.Scene();
    this._scene.fog = new THREE.FogExp2(0x000022, 0.002);

    var renderPass = new THREE.RenderPass(this._scene, this._camera);

    this._composer.setSize(window.innerWidth, window.innerHeight);
    this._composer.addPass(renderPass);
    this._composer.addPass(bloomPass);

    // init GUI 
    // var gui = new dat.GUI();
    // gui.add(params, 'exposure', 0.1, 2).onChange(function (value) {
    //   this._renderer.toneMappingExposure = Math.pow(value, 4.0);
    // });
    // gui.add(params, 'bloomThreshold', 0.0, 1.0).onChange(function (value) {
    //   bloomPass.threshold = Number(value);
    // });
    // gui.add(params, 'bloomStrength', 0.0, 3.0).onChange(function (value) {
    //   bloomPass.strength = Number(value);
    // });
    // gui.add(params, 'bloomRadius', 0.0, 1.0).step(0.01).onChange(function (value) {
    //   bloomPass.radius = Number(value);
    // });

    //set OrbitControls
    // controls
    this._controls = new THREE.OrbitControls(this._camera, this._renderer.domElement);
    this._controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    this._controls.dampingFactor = 0.25;
    this._controls.screenSpacePanning = false;
    this._controls.minDistance = 10;
    this._controls.maxDistance = 500;
    this._controls.maxPolarAngle = Math.PI / 2;

    this._controls.target.set(0, 5, 0);

    //init light

    let ambilLight = new THREE.AmbientLight(0xCCCCCC);
    this._scene.add(ambilLight);

    //init graph object
    this.graphMeshes = new Array();
    this.graphMaterials = new Array();
    let length = 64;
    this.graphMeshWrapper = new THREE.Object3D();
    let meshW = 0.5;
    for (let i = 0; i < length; i++) {
      let material = new THREE.MeshPhongMaterial();
      let geometry = new THREE.CubeGeometry(meshW, 1, 2);
      this.graphMeshes[i] = new THREE.Mesh(geometry, material);
      this.graphMaterials[i] = material;
      this.graphMeshes[i].position.set(i * (meshW * 2) - (length * (meshW * 2) / 2), 0, +2);
      this.graphMeshWrapper.add(this.graphMeshes[i]);
    }
    this._scene.add(this.graphMeshWrapper);

    //add grid line
    let interval = 5;
    let max = 20;
    for (let i = 0; i < max + 1; i++) {
      //頂点座標の追加
      let geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3(-interval * max / 2, 0, i * interval - (interval * max / 2)));
      geometry.vertices.push(new THREE.Vector3(+interval * max / 2, 0, i * interval - (interval * max / 2)));

      //線オブジェクトの生成
      let line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x000077 }));
      //sceneにlineを追加
      this.graphMeshWrapper.add(line);
    }
    for (let i = 0; i < max + 1; i++) {
      //頂点座標の追加
      let geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3(i * interval - (interval * max / 2), 0, -interval * max / 2));
      geometry.vertices.push(new THREE.Vector3(i * interval - (interval * max / 2), 0, +interval * max / 2));
      //線オブジェクトの生成
      let line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x000077 }));
      //sceneにlineを追加
      this.graphMeshWrapper.add(line);
      this.graphMeshWrapper.position.setY(0.01);
    }

    this.setResizeEvent();
    this.doUpdate();

    let soundUrl = 'sound/EzaOne - Supernova.mp3';
    this.audioController = new AudioController();
    this.audioController.loadSound(soundUrl, (buffer) => {
      $("#loading-panel").hide();

      this.audioController.setBuffer(buffer);
      let context = this.audioController.context;
      let analyser = context.createAnalyser();
      analyser.minDecibels = -100;
      analyser.maxDecibels = -20;
      this.analyser = analyser;
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.2;
    });
    this.audioController.onPlaying = () => {
      let src = this.audioController.source;
      src.connect(this.analyser);
    };

    // Stats
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
  }

  public doUpdate(): void {
    if (this.stats) {
      this.stats.begin();
    }

    if (!this.oldUpdateTime) {
      this.oldUpdateTime = new Date().getTime();
    }
    let now = new Date().getTime();
    let delta = now - this.oldUpdateTime;
    this.oldUpdateTime = now;
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

    let doUpdateSubRoutine = (obj: THREE.Object3D) => {
      if (obj['onUpdate'] instanceof Function) {
        obj['onUpdate'](delta);
      }

      for (let child of obj.children) {
        doUpdateSubRoutine(child);
      }
    };
    doUpdateSubRoutine(this._scene);

    this._composer.render();

    if (this.stats) {
      this.stats.end();
    }
  }

  public onUpdate(delta: number): void {

    let count = this.graphMeshes.length;
    let data = new Uint8Array(count);
    if (this.analyser) {
      this.analyser.getByteFrequencyData(data);
    }

    for (let i = 0; i < count; ++i) {
      let h = data[i] * 0.1 + 0.00001; // オブジェクトの高さに0をセットしてはいけないため調整
      this.graphMeshes[i].scale.setY(h);
      this.graphMeshes[i].position.setY(h / 2);

      let color = new THREE.Color('hsl(' + (data[i] / 255 * 360) + ', 70%, ' + 50 + '%)').getHex();
      (Object)(this.graphMaterials[i]).color.set(color);
    }
    this._controls.update();
    //this._scene.rotateY(delta / 1000 * 0.05 * Math.PI);
  }

  private setResizeEvent(): void {
    let doResizeSubRoutine = (obj: THREE.Object3D, width: number, height: number) => {
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