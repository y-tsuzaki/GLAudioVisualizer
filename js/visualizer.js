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
var main = (function () {
    function main() {
    }
    main.prototype.canvas = function () {
    };
    return main;
}());
/// <reference path="../../typings/index.d.ts" />
var core;
(function (core) {
    var Object = (function (_super) {
        __extends(Object, _super);
        function Object() {
            var _this = this;
            return _this;
        }
        Object.prototype.onAdded = function () {
        };
        Object.prototype.onRemoved = function () {
        };
        Object.prototype.onResized = function () {
        };
        Object.prototype.start = function () {
        };
        return Object;
    }(THREE.Object3D));
    core.Object = Object;
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
//# sourceMappingURL=visualizer.js.map