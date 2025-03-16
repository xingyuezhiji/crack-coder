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
    const [isProcessing, setIsProcessing] = (0, react_1.useState)(false);
    const [result, setResult] = (0, react_1.useState)(null);
    const [screenshots, setScreenshots] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        // Listen for processing complete events
        window.electron.onProcessingComplete((result) => {
            setResult(result);
            setIsProcessing(false);
        });
        // Listen for new screenshots
        window.electron.onScreenshotTaken((screenshot) => {
            setScreenshots(prev => [...prev, screenshot]);
        });
        // Listen for queue reset
        window.electron.onQueueReset(() => {
            setScreenshots([]);
        });
    }, []);
    const handleMinimize = () => {
        if (window.electron)
            window.electron.minimize();
    };
    const handleClose = () => {
        if (window.electron)
            window.electron.close();
    };
    const handleTakeScreenshot = async () => {
        if (screenshots.length >= 4)
            return;
        await window.electron.takeScreenshot();
    };
    const handleProcess = async () => {
        setIsProcessing(true);
        setResult(null);
        await window.electron.processScreenshots();
    };
    const handleReset = async () => {
        await window.electron.resetQueue();
    };
    const handleQuit = () => {
        window.electron.quit();
    };
    return (react_1.default.createElement("div", { className: "app" },
        react_1.default.createElement("div", { className: "window-controls" },
            react_1.default.createElement("button", { className: "control minimize", onClick: handleMinimize, title: "Minimize" }, "\u2212"),
            react_1.default.createElement("button", { className: "control close", onClick: handleClose, title: "Close" }, "\u00D7")),
        react_1.default.createElement("h1", null, "Screenshot Processor"),
        react_1.default.createElement("div", { className: "card" },
            react_1.default.createElement("div", { className: "shortcuts-info" },
                react_1.default.createElement("p", null,
                    react_1.default.createElement("code", null, "Cmd/Ctrl + H"),
                    " - Take Screenshot"),
                react_1.default.createElement("p", null,
                    react_1.default.createElement("code", null, "Cmd/Ctrl + Enter"),
                    " - Process Queue"),
                react_1.default.createElement("p", null,
                    react_1.default.createElement("code", null, "Cmd/Ctrl + R"),
                    " - Reset Queue"),
                react_1.default.createElement("p", null,
                    react_1.default.createElement("code", null, "Cmd/Ctrl + B"),
                    " - Toggle Window"),
                react_1.default.createElement("p", null,
                    react_1.default.createElement("code", null, "Cmd/Ctrl + Q"),
                    " - Quit App")),
            react_1.default.createElement("div", { className: "status" },
                react_1.default.createElement("p", null,
                    "Screenshots in queue: ",
                    screenshots.length,
                    "/4"),
                isProcessing && react_1.default.createElement("p", { className: "processing" }, "Processing..."),
                result && react_1.default.createElement("div", { className: "result" }, result)),
            screenshots.length > 0 && (react_1.default.createElement("div", { className: "preview-grid" }, screenshots.map(screenshot => (react_1.default.createElement("div", { key: screenshot.id, className: "preview-item" },
                react_1.default.createElement("img", { src: screenshot.preview, alt: "Screenshot preview" })))))),
            react_1.default.createElement("div", { className: "actions" },
                react_1.default.createElement("button", { onClick: handleTakeScreenshot, disabled: isProcessing || screenshots.length >= 4 }, "Take Screenshot"),
                react_1.default.createElement("button", { onClick: handleProcess, disabled: isProcessing || screenshots.length === 0 }, "Process Queue"),
                react_1.default.createElement("button", { onClick: handleReset, disabled: isProcessing && screenshots.length === 0 }, "Reset"),
                react_1.default.createElement("button", { onClick: handleQuit }, "Quit")))));
};
exports.default = App;
