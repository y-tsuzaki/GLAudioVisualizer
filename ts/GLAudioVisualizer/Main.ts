
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

    public init() : void {
      let width  = window.innerWidth;
      let height = window.innerHeight;

      // init renderer
      this._renderer = new THREE.WebGLRenderer();
      this._renderer.setClearColor( 0x9999BB );
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

      //init scene
      this._scene = new THREE.Scene();

      //init light
      let directionalLight = new THREE.DirectionalLight( 0xffffff );
      directionalLight.position.set( 0, 0.7, 0.7 );
      this._scene.add( directionalLight );

      //init object
      this.meshes = new Array();
      this.meshWrapper = new THREE.Object3D();
      for (let i = 0; i < 64; i++) {
        let geometry = new THREE.CubeGeometry( 0.9, 1, 1 );
        let material = new THREE.MeshPhongMaterial( { color: 0xff0000 } );
        this.meshes[i] = new THREE.Mesh( geometry, material );
        this.meshes[i].position.set(i - 64 / 2, -30, 0);
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
        analyser.smoothingTimeConstant = 0.7;
      });
    }
    private analyser: any;

    //
    private oldUpdateTime: number;
    public doUpdate() : void {
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
        let h = data[i] * 0.05 + 0.01;
        this.meshes[i].scale.setY(h);
        this.meshes[i].position.setY(h / 2 - 10);
      }
      console.log(delta);
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
