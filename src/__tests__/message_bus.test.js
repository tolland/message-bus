"use strict";
// src/messaging/__tests__/message_bus.test.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// Mock browser API
var extensible_message_bus_1 = require("../extensible_message_bus");
var types_1 = require("../types");
var example_message_types_1 = require("./example_message_types");
var mockSendMessage = jest.fn();
var mockAddListener = jest.fn();
var mockTabs = {
    query: jest.fn().mockResolvedValue([]),
    sendMessage: jest.fn()
};
// Setup global browser mock
global.browser = {
    runtime: {
        sendMessage: mockSendMessage,
        onMessage: {
            addListener: mockAddListener
        }
    },
    tabs: mockTabs
};
describe('MessageBus', function () {
    var messageBus;
    var listenerCallback;
    beforeEach(function () {
        // Clear mocks
        jest.clearAllMocks();
        // Create fresh instance for each test
        messageBus = new extensible_message_bus_1.ExtensibleMessageBus();
        // Get the listener callback that was registered
        listenerCallback = mockAddListener.mock.calls[0][0];
    });
    test('should register a message listener on creation', function () {
        expect(mockAddListener).toHaveBeenCalled();
    });
    test('should publish base message types with correct type checking', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Test with PING message (from BaseMessageTypes)
                return [4 /*yield*/, messageBus.publish({
                        type: types_1.BaseMessageTypes.PING,
                        payload: { someData: 'test' },
                        target: 'background'
                    })];
                case 1:
                    // Test with PING message (from BaseMessageTypes)
                    _a.sent();
                    expect(mockSendMessage).toHaveBeenCalledWith(expect.objectContaining({
                        type: types_1.BaseMessageTypes.PING,
                        payload: { someData: 'test' },
                        target: 'background'
                    }));
                    return [2 /*return*/];
            }
        });
    }); });
    test('should publish EXIF message types with correct type checking', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockContext;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockContext = { getRequestContext: jest.fn().mockReturnValue('content') };
                    messageBus.contextDetector = mockContext;
                    // Test with EXIF_DATA_READY message (from ExifMessageTypes)
                    return [4 /*yield*/, messageBus.publish({
                            type: example_message_types_1.ExampleMessageTypes.EXIF_DATA_READY,
                            payload: { /* mock ExifReadyMessage structure */},
                            target: 'background'
                        })];
                case 1:
                    // Test with EXIF_DATA_READY message (from ExifMessageTypes)
                    _a.sent();
                    expect(mockSendMessage).toHaveBeenCalledWith(expect.objectContaining({
                        type: example_message_types_1.ExampleMessageTypes.EXIF_DATA_READY,
                        target: 'background'
                    }));
                    return [2 /*return*/];
            }
        });
    }); });
    test('should subscribe to message types and call handlers', function () { return __awaiter(void 0, void 0, void 0, function () {
        var pingHandler, exifDataHandler, pingMessage, exifMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pingHandler = jest.fn().mockResolvedValue(undefined);
                    exifDataHandler = jest.fn().mockResolvedValue({ success: true });
                    // Subscribe to messages
                    messageBus.subscribe(types_1.BaseMessageTypes.PING, pingHandler);
                    messageBus.subscribe(example_message_types_1.ExampleMessageTypes.EXIF_DATA_READY, exifDataHandler);
                    pingMessage = {
                        type: types_1.BaseMessageTypes.PING,
                        payload: { data: 'test' },
                        target: 'content'
                    };
                    return [4 /*yield*/, listenerCallback(pingMessage, {}, jest.fn())];
                case 1:
                    _a.sent();
                    expect(pingHandler).toHaveBeenCalledWith(expect.objectContaining({
                        type: types_1.BaseMessageTypes.PING,
                        payload: { data: 'test' }
                    }));
                    exifMessage = {
                        type: example_message_types_1.ExampleMessageTypes.EXIF_DATA_READY,
                        payload: { /* mock payload */},
                        target: 'background'
                    };
                    return [4 /*yield*/, listenerCallback(exifMessage, {}, jest.fn())];
                case 2:
                    _a.sent();
                    expect(exifDataHandler).toHaveBeenCalledWith(expect.objectContaining({
                        type: example_message_types_1.ExampleMessageTypes.EXIF_DATA_READY
                    }));
                    return [2 /*return*/];
            }
        });
    }); });
    test('should ignore non-message-bus format messages', function () { return __awaiter(void 0, void 0, void 0, function () {
        var handler, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handler = jest.fn();
                    messageBus.subscribe(types_1.BaseMessageTypes.PING, handler);
                    return [4 /*yield*/, listenerCallback({
                            someOtherProperty: true
                        }, {}, jest.fn())];
                case 1:
                    result = _a.sent();
                    expect(result).toBe(false);
                    expect(handler).not.toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should unsubscribe handlers correctly', function () { return __awaiter(void 0, void 0, void 0, function () {
        var pingHandler, unsubscribe;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pingHandler = jest.fn();
                    unsubscribe = messageBus.subscribe(types_1.BaseMessageTypes.PING, pingHandler);
                    // Simulate message - handler should be called
                    return [4 /*yield*/, listenerCallback({
                            type: types_1.BaseMessageTypes.PING,
                            payload: {},
                            target: 'background'
                        }, {}, jest.fn())];
                case 1:
                    // Simulate message - handler should be called
                    _a.sent();
                    expect(pingHandler).toHaveBeenCalledTimes(1);
                    // Unsubscribe
                    unsubscribe();
                    // Reset mock
                    pingHandler.mockReset();
                    // Simulate message again - handler should not be called
                    return [4 /*yield*/, listenerCallback({
                            type: types_1.BaseMessageTypes.PING,
                            payload: {},
                            target: 'background'
                        }, {}, jest.fn())];
                case 2:
                    // Simulate message again - handler should not be called
                    _a.sent();
                    expect(pingHandler).not.toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should route messages to correct targets', function () { return __awaiter(void 0, void 0, void 0, function () {
        var message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Mock a tab
                    mockTabs.query.mockResolvedValue([{ id: 123 }]);
                    // Simulate background script
                    messageBus.isBackgroundScript = jest.fn().mockReturnValue(true);
                    message = {
                        type: types_1.BaseMessageTypes.PING,
                        payload: {},
                        target: 'content',
                        tabId: 123
                    };
                    // Dispatch from background
                    return [4 /*yield*/, messageBus.dispatchFromBackground(message)];
                case 1:
                    // Dispatch from background
                    _a.sent();
                    // Should send to tab
                    expect(mockTabs.sendMessage).toHaveBeenCalledWith(123, message);
                    return [2 /*return*/];
            }
        });
    }); });
    // Type error test - Must be verified at compile time
    // This is just for documentation purposes
    test('should enforce type checking at compile time', function () {
        //// @ts-expect-error - Invalid message type
        messageBus.publish({
            type: 'INVALID_TYPE',
            payload: {},
            target: 'background'
        });
        messageBus.publish({
            type: types_1.BaseMessageTypes.PING,
            // @ts-expect-error - Invalid payload structure for PING
            payload: 123, // Should be an object
            target: 'background'
        });
    });
});
