"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
require("./App.css");
const App = () => {
    const [count, setCount] = (0, react_1.useState)(0);
    const handleMinimize = () => {
        if (window.electron)
            window.electron.minimize();
    };
    const handleClose = () => {
        if (window.electron)
            window.electron.close();
    };
    return (react_1.default.createElement("div", { className: "app" },
        react_1.default.createElement("div", { className: "window-controls" },
            react_1.default.createElement("button", { className: "control minimize", onClick: handleMinimize, title: "Minimize" }, "\u2212"),
            react_1.default.createElement("button", { className: "control close", onClick: handleClose, title: "Close" }, "\u00D7")),
        react_1.default.createElement("h1", null, "Welcome to Your Electron React App!"),
        react_1.default.createElement("div", { className: "card" },
            react_1.default.createElement("button", { onClick: () => setCount(count + 1) },
                "Count is ",
                count),
            react_1.default.createElement("p", null,
                "Edit ",
                react_1.default.createElement("code", null, "src/renderer/App.tsx"),
                " and save to test HMR"))));
};
exports.default = App;
