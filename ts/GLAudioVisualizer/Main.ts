
namespace GLAudioVisualizer {
  export class Main {

    private _canvasWrapper: HTMLElement;
    public constructor(canvasWrapper: HTMLElement) {
      this._canvasWrapper = canvasWrapper;
    }

    private _renderer: THREE.WebGLRenderer;
    public get renderer(): THREE.WebGLRenderer {
      return this._renderer;
    }

    private _canvas: HTMLElement;
    private _camera: THREE.PerspectiveCamera ;

    private _scene: THREE.Scene;

    public meshes1: Array<THREE.Object3D>;
    public meshes2: Array<THREE.Object3D>;
    public materials: Array<THREE.Material>;
    public meshWrapper: THREE.Object3D;

    public audioController: AudioController;
    public stats: any;

    public init() : void {
      let width  = window.innerWidth;
      let height = window.innerHeight;

      // init renderer
      this._renderer = new THREE.WebGLRenderer();
      this._renderer.setClearColor( 0x000011 );
      this._renderer.setSize( width, height );
      $(this._canvasWrapper).append( this._renderer.domElement );

      // init camera
      let fov    = 60;
      let aspect = width / height;
      let near   = 1;
      let far    = 1000;
      this._camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
      this._camera.position.set( 0, 10.0, 20 + 50 * (1 / aspect));
      this._camera['onResized'] = (w: number, h: number) => {
        aspect = w / h;
        this._camera.aspect = aspect;

        this._camera.position.set( 0, 10.0, 20 + 50 * (1 / aspect));
        this._camera.updateProjectionMatrix();
      };

      //init scene
      this._scene = new THREE.Scene();

      //init light

    let ambilLight = new THREE.AmbientLight( 0x333333 );
      this._scene.add( ambilLight );

      let directionalLight = new THREE.DirectionalLight( 0xffffff );
      directionalLight.intensity = 2.0;
      directionalLight.position.set( 0, 0.7, 0.7 );
      this._scene.add( directionalLight );

      //init object
      this.meshes1 = new Array();
      this.meshes2 = new Array();
      this.materials = new Array();
      let length = 128;
      this.meshWrapper = new THREE.Object3D();
      let meshW = 0.5;
      for (let i = 0; i < length; i++) {
        let geometry = new THREE.CubeGeometry( meshW, 1, 2 );
        let material1 = new THREE.MeshPhongMaterial({color: '#FFFFFF'});
        let material2 = new THREE.MeshPhongMaterial();
        this.meshes1[i] = new THREE.Mesh( geometry, material1 );
        let geometry2 = new THREE.CubeGeometry( meshW, 1, 2 );
        this.meshes2[i] = new THREE.Mesh( geometry2, material2 );
        this.materials[i] = material2;
        this.meshes1[i].position.set(i * meshW  - (length * meshW  / 2), 0, 0);
        this.meshes2[i].position.set(i * meshW  - (length * meshW  / 2), 0, +2);
        // mesh['onUpdate'] = () => {
        //   mesh.rotation.set(
        //     0,
        //     mesh.rotation.y + .01,
        //     mesh.rotation.z + .01
        //   );
        // };
        this.meshWrapper.add( this.meshes1[i]);
        this.meshWrapper.add( this.meshes2[i]);
      }
      this._scene.add(this.meshWrapper);

      //add grid line

      let interval = 5;
      let max = 20;
      for (let i = 0; i < max + 1; i++) {
          //頂点座標の追加
          let geometry = new THREE.Geometry();
          geometry.vertices.push( new THREE.Vector3( -interval * max / 2, 0, i * interval - (interval * max / 2)));
          geometry.vertices.push( new THREE.Vector3( +interval * max / 2, 0,  i * interval - (interval * max / 2)));

          //線オブジェクトの生成
          let line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0x000077} ) );
          //sceneにlineを追加
          this.meshWrapper.add( line );
      }
      for (let i = 0; i < max + 1; i++) {
          //頂点座標の追加
          let geometry = new THREE.Geometry();
          geometry.vertices.push( new THREE.Vector3(i * interval - (interval * max / 2), 0, -interval * max / 2));
          geometry.vertices.push( new THREE.Vector3(i * interval - (interval * max / 2), 0, +interval * max / 2));
          //線オブジェクトの生成
          let line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0x000077} ) );
          //sceneにlineを追加
          this.meshWrapper.add( line );
      }

      this.setResizeEvent();
      this.doUpdate();

      let soundUrl = 'sound/EzaOne - Supernova.mp3';
      this.audioController = new AudioController();
      this.audioController.loadSound(soundUrl, (buffer) => {
       this.audioController.setBuffer(buffer);
        let context = this.audioController.context;
        let analyser = context.createAnalyser();
        analyser.minDecibels = -100;
        analyser.maxDecibels = -20;
        this.analyser = analyser;
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.7;
      });
      this.audioController.onPlaying = () => {
        let src = this.audioController.source;
        src.connect(this.analyser);
      };

      // Stats
      /* tslint:disable */
      // tslint:disable-next-line <optional rule identifier>
      this.stats = new Stats(); // tslint:disable-line
      /* tslint:enable */
      document.body.appendChild( this.stats.dom );
    }
    private analyser: any;

    //
    private oldUpdateTime: number;
    public doUpdate() : void {
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

      requestAnimationFrame( () => {
        this.doUpdate();
      } );

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
      this._renderer.render( this._scene, this._camera );

      if (this.stats) {
        this.stats.end();
      }
    }

    public onUpdate(delta: number) : void {

      if (!this.analyser) {
        return;
      }
      let count = this.meshes1.length;
      let data = new Uint8Array(count);
      this.analyser.getByteTimeDomainData(data);
      for (let i = 0; i < count; ++i) {
        // console.log('[' + i + ']:' + data[i]);
        let h = data[i] * 0.1 + 0.01;
        this.meshes1[i].scale.setY(h);
      }

      data = new Uint8Array(count);
      this.analyser.getByteFrequencyData(data);
      for (let i = 0; i < count; ++i) {
        // console.log('[' + i + ']:' + data[i]);
        let h = data[i] * (data[i] / 100)  * 0.08 + 0.01;
        this.meshes2[i].scale.setY(h);

        let color = new THREE.Color('hsl(' + (i / count * 360) + ', 100%, 50%)').getHex();
        (Object)(this.materials[i]).color.set(color);
      }

      this.meshWrapper.rotation.set(
        0,
        this.meshWrapper.rotation.y + (delta / 10000),
        0
      );
    }

    //
    private setResizeEvent() : void {
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

        this._renderer.setSize( w, h );
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
}
