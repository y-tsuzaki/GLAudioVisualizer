/// <reference path="../../typings/index.d.ts" />
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
var core;
(function (core) {
    var Object = (function (_super) {
        __extends(Object, _super);
        function Object() {
            return _super.call(this) || this;
        }
        Object.prototype.onClicked = function (a, b) {
        };
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
var test = (function (_super) {
    __extends(test, _super);
    function test() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return test;
}(core.Object));
