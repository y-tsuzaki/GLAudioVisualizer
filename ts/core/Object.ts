/// <reference path="../../typings/index.d.ts" />

namespace core {
	export abstract class Object extends THREE.Object3D implements IMouseEventListener {

    public onClicked(a, b):void{

    }
    testVal : number;
		constructor() {
      super();
		}
		public onAdded() {
		}
		public onRemoved(){

		}

		public onResized(){
		}

		public start() {
		}
	}

	export interface IWindowEventListener {

	}
	export interface ICavasEventListener {

	}

	export interface IMouseEventListener {
		onClicked(x,y) : void;
		testVal : number;
	}
}
class test extends core.Object {

}
