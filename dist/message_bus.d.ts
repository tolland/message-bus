import { Message, MessageTypeMap } from './types';
/**
 *
 */
export declare class MessageBus {
    private readonly hash;
    private handlers;
    private options;
    static getInstance(): MessageBus;
    private constructor();
    publish<K extends keyof MessageTypeMap & MessageType>(message: Omit<Message<MessageTypeMap[K]['request'], MessageTypeMap[K]['response']>, 'type'> & {
        type: K;
    }): Promise<MessageTypeMap[K]['response']>;
    private isMessageBusFormat;
    private handleIncomingMessage;
    subscribe<K extends keyof MessageTypeMap & MessageType>(type: K, handler: (message: Message<MessageTypeMap[K]['request'], MessageTypeMap[K]['response']>) => Promise<MessageTypeMap[K]['response'] | void>): () => void;
    private routeMessage;
    private broadcastMessage;
    private triggerHandlers;
    private dispatchFromBackground;
    private broadcastToAllContentScripts;
}
//# sourceMappingURL=message_bus.d.ts.map