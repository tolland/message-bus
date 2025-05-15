// src/messaging/__tests__/message_bus.test.ts


// Mock browser API
import { ExtensibleMessageBus } from '../extensible_message_bus';
import { BaseMessageTypes } from '../types';
import { ExampleAppMessageTypeMap, ExampleMessageTypeMap, ExampleMessageTypes } from './example_message_types';

const mockSendMessage = jest.fn();
const mockAddListener = jest.fn();
const mockTabs = {
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
} as any;

describe('MessageBus', () => {
    let messageBus: ExtensibleMessageBus<ExampleAppMessageTypeMap>;
    let listenerCallback: Function;

    beforeEach(() => {
        // Clear mocks
        jest.clearAllMocks();

        // Create fresh instance for each test
        messageBus = new ExtensibleMessageBus<ExampleAppMessageTypeMap>();

        // Get the listener callback that was registered
        listenerCallback = mockAddListener.mock.calls[0][0];
    });

    test('should register a message listener on creation', () => {
        expect(mockAddListener).toHaveBeenCalled();
    });

    test('should publish base message types with correct type checking', async () => {
        // Test with PING message (from BaseMessageTypes)
        await messageBus.publish({
            type: BaseMessageTypes.PING,
            payload: { someData: 'test' },
            target: 'background'
        });

        expect(mockSendMessage).toHaveBeenCalledWith(expect.objectContaining({
            type: BaseMessageTypes.PING,
            payload: { someData: 'test' },
            target: 'background'
        }));
    });

    test('should publish EXIF message types with correct type checking', async () => {
        // Mock the getRequestContext to return 'content'
        const mockContext = { getRequestContext: jest.fn().mockReturnValue('content') } as any;
        (messageBus as any).contextDetector = mockContext;

        // Test with EXIF_DATA_READY message (from ExifMessageTypes)
        await messageBus.publish({
            type: ExampleMessageTypes.EXIF_DATA_READY,
            payload: { /* mock ExifReadyMessage structure */ } as any,
            target: 'background'
        });

        expect(mockSendMessage).toHaveBeenCalledWith(expect.objectContaining({
            type: ExampleMessageTypes.EXIF_DATA_READY,
            target: 'background'
        }));
    });

    test('should subscribe to message types and call handlers', async () => {
        const pingHandler = jest.fn().mockResolvedValue(undefined);
        const exifDataHandler = jest.fn().mockResolvedValue({ success: true });

        // Subscribe to messages
        messageBus.subscribe(BaseMessageTypes.PING, pingHandler);
        messageBus.subscribe(ExampleMessageTypes.EXIF_DATA_READY, exifDataHandler);

        // Simulate receiving a PING message
        const pingMessage = {
            type: BaseMessageTypes.PING,
            payload: { data: 'test' },
            target: 'content'
        };

        await listenerCallback(pingMessage, {}, jest.fn());

        expect(pingHandler).toHaveBeenCalledWith(expect.objectContaining({
            type: BaseMessageTypes.PING,
            payload: { data: 'test' }
        }));

        // Simulate receiving an EXIF_DATA_READY message
        const exifMessage = {
            type: ExampleMessageTypes.EXIF_DATA_READY,
            payload: { /* mock payload */ },
            target: 'background'
        };

        await listenerCallback(exifMessage, {}, jest.fn());

        expect(exifDataHandler).toHaveBeenCalledWith(expect.objectContaining({
            type: ExampleMessageTypes.EXIF_DATA_READY
        }));
    });

    test('should ignore non-message-bus format messages', async () => {
        const handler = jest.fn();
        messageBus.subscribe(BaseMessageTypes.PING, handler);

        // Non-valid message format
        const result = await listenerCallback({
            someOtherProperty: true
        }, {}, jest.fn());

        expect(result).toBe(false);
        expect(handler).not.toHaveBeenCalled();
    });

    test('should unsubscribe handlers correctly', async () => {
        const pingHandler = jest.fn();

        // Subscribe and get unsubscribe function
        const unsubscribe = messageBus.subscribe(BaseMessageTypes.PING, pingHandler);

        // Simulate message - handler should be called
        await listenerCallback({
            type: BaseMessageTypes.PING,
            payload: {},
            target: 'background'
        }, {}, jest.fn());

        expect(pingHandler).toHaveBeenCalledTimes(1);

        // Unsubscribe
        unsubscribe();

        // Reset mock
        pingHandler.mockReset();

        // Simulate message again - handler should not be called
        await listenerCallback({
            type: BaseMessageTypes.PING,
            payload: {},
            target: 'background'
        }, {}, jest.fn());

        expect(pingHandler).not.toHaveBeenCalled();
    });

    test('should route messages to correct targets', async () => {
        // Mock a tab
        mockTabs.query.mockResolvedValue([{ id: 123 }]);

        // Simulate background script
        (messageBus as any).isBackgroundScript = jest.fn().mockReturnValue(true);

        // Create a message for a content script
        const message = {
            type: BaseMessageTypes.PING,
            payload: {},
            target: 'content',
            tabId: 123
        };

        // Dispatch from background
        await (messageBus as any).dispatchFromBackground(message);

        // Should send to tab
        expect(mockTabs.sendMessage).toHaveBeenCalledWith(123, message);
    });

    // Type error test - Must be verified at compile time
    // This is just for documentation purposes
    test('should enforce type checking at compile time', () => {
        //// @ts-expect-error - Invalid message type
        messageBus.publish({
            type: 'INVALID_TYPE',
            payload: {},
            target: 'background'
        });


        messageBus.publish({
            type: BaseMessageTypes.PING,
            // @ts-expect-error - Invalid payload structure for PING
            payload: 123, // Should be an object
            target: 'background'
        });
    });
});