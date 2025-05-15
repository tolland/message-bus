// global.d.ts
import { MessageBus } from './message_bus';
import { ExtensibleMessageBus } from './extensible_message_bus';

declare global {
    interface Window {
        browser: typeof browser;
        __messagingApiInstance?: MessageBus;
    }
}

export {};
