
namespace GLAudioVisualizer {
  const CanvasElemID: String = 'canvas-main';
  export class Main {

    private static __instance: Main;

    public static get instance() : Main {
      if (!Main.__instance) {
        Main.__instance = new Main();
      }

      return Main.__instance;
    }

    private constructor() {
    }

    private _renderer: THREE.WebGLRenderer;
    public get renderer(): THREE.WebGLRenderer {
      return this._renderer;
    }

    private _canvas: HTMLElement;
    private _camera: THREE.PerspectiveCamera ;

    private _scene: THREE.Scene;

    public meshes: Array<THREE.Object3D>;
    public meshWrapper: THREE.Object3D;

    public stats: any;

    public init() : void {
      let width  = window.innerWidth;
      let height = window.innerHeight;

      // init renderer
      this._renderer = new THREE.WebGLRenderer();
      this._renderer.setClearColor( 0x000011 );
      this._renderer.setSize( width, height );
      $('#canvas-wrapper').append( this._renderer.domElement );

      // init camera
      let fov    = 60;
      let aspect = width / height;
      let near   = 1;
      let far    = 1000;
      this._camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
      this._camera.position.set( 0, 0, 50 );
      this._camera['onResized'] = (w: number, h: number) => {
        this._camera.aspect = w / h;
        this._camera.updateProjectionMatrix();
      };
      this._camera.position.setY(10.0);

      //init scene
      this._scene = new THREE.Scene();

      //init light
      let directionalLight = new THREE.AmbientLight( 0xffffff );
      // directionalLight.position.set( 0, 0.7, 0.7 );
      this._scene.add( directionalLight );

      //init object
      this.meshes = new Array();
      this.meshWrapper = new THREE.Object3D();
      for (let i = 0; i < 128; i++) {
        let geometry = new THREE.CubeGeometry( 0.5, 1, 2 );
        let colorRGB = Color.HSVtoRGB(i / 128, 0.5, 0.5);
        let color = new THREE.Color('hsl(' + (i / 128 * 360) + ', 100%, 50%)').getHex();
        let material = new THREE.MeshPhongMaterial( { color: color } );
        this.meshes[i] = new THREE.Mesh( geometry, material );
        this.meshes[i].position.set(i * 0.5  - 64 / 2, -30, 0);
        // mesh['onUpdate'] = () => {
        //   mesh.rotation.set(
        //     0,
        //     mesh.rotation.y + .01,
        //     mesh.rotation.z + .01
        //   );
        // };
        this.meshWrapper.add( this.meshes[i]);
      }
      this._scene.add(this.meshWrapper);

      //add glid line

      let interval = 2;
      let max = 100;
      for (let i = 0; i < max; i++) {
          //頂点座標の追加
          let geometry = new THREE.Geometry();
          geometry.vertices.push( new THREE.Vector3( -interval * max / 2, 0, i * interval - (interval * max / 2)));
          geometry.vertices.push( new THREE.Vector3( +interval * max / 2, 0,  i * interval - (interval * max / 2)));

          //線オブジェクトの生成
          let line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0x000099} ) );

          //sceneにlineを追加
          this.meshWrapper.add( line );
      }
      for (let i = 0; i < max; i++) {
          //頂点座標の追加
          let geometry = new THREE.Geometry();
          geometry.vertices.push( new THREE.Vector3(i * interval - (interval * max / 2), 0, -interval * max / 2));
          geometry.vertices.push( new THREE.Vector3(i * interval - (interval * max / 2), 0, +interval * max / 2));

          //線オブジェクトの生成
          let line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0x000099} ) );

          //sceneにlineを追加
          this.meshWrapper.add( line );
      }

      this.setResizeEvent();
      this.doUpdate();

      let soundUrl = 'sound/electric-mantis-daybreak.mp3';
      AudioController.instance.loadSound(soundUrl, (buffer) => {
         AudioController.instance.playSound(buffer);

        let context = AudioController.instance.context;
        let src = AudioController.instance.source;
        let analyser = context.createAnalyser();
        analyser.minDecibels = -100;
        analyser.maxDecibels = -20;
        this.analyser = analyser;
        src.connect(analyser);
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.8;
      });

      // Stats
      this.stats = new Stats();
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
      let count = this.meshes.length;
      let data = new Uint8Array(count);
      this.analyser.getByteFrequencyData(data);
      for (let i = 0; i < count; ++i) {
        // console.log('[' + i + ']:' + data[i]);
        let h = data[i] * (data[i] / 100)  * 0.05 + 0.01;
        this.meshes[i].scale.setY(h);
        this.meshes[i].position.setY(h / 2);
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
