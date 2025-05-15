// Define request/response types for each message type
import { BaseMessageTypeMap } from '../types';


export interface FetchXifrResourceRequestX {
    propertiesObj: any;
    xifrPopupDataObject: any;
    imgrequest: any;
}

export type WinProps = {
    scr: {
        width: number;
        availWidth: number;
        height: number;
        availHeight: number;
    };
    win: {
        width: number;
        height: number;
        top: number;
        left: number;
    };
}

export type PopupPropertiesObject = {
    URL: string;
    crossOrigin: string;
    referrerPolicy: string;
    naturalWidth?: number;
    naturalHeight?: number;
    source?: string;
    context?: string;
    tabId?: number;
    tabUrl?: string;
    jpegUrl?: string;
    wprop: WinProps;
    pageShownURL?: string;
    pageShownType?: string;
    byteLength?: string;
    contentType?: string;
    lastModified?: string;
}

export type ExifReadyMessage = {
    infos: any;
    warnings: any;
    errors: any;
    properties: PopupPropertiesObject;
    data: {};
}

export type PopupDataInitialDTO = {
    data?: any;
    info?: string;
    properties?: any;
    error?: any;
}

export interface FetchXifrResourceResponseX {
    success: boolean;
    data?: any;
    error?: string;
}

// EXIF-specific message types as string constants
export const ExampleMessageTypes = {
    EXIF_DATA_READY: 'EXIF_DATA_READY',
    FETCH_XIFR_RESOURCE: 'FETCH_XIFR_RESOURCE',
    FETCH_XIFR_RESOURCE2: 'FETCH_XIFR_RESOURCE2',
    SAVE_IMAGE_TO_COLLECTION: 'SAVE_IMAGE_TO_COLLECTION',
    SHADOW_DOM_TEST: 'SHADOW_DOM_TEST',
    IMAGE_SEARCH: 'IMAGE_SEARCH',
    // IMAGE_FOCUS = 'IMAGE_FOCUS',
    // IMAGE_BLUR = 'IMAGE_BLUR',
    // FETCH_IMAGE = 'FETCH_IMAGE',
    // FETCH_FAILED = 'FETCH_FAILED',
    // UPDATE_SIDEBAR = 'UPDATE_SIDEBAR',
} as const;

export type ExampleMessageType =
    (typeof ExampleMessageTypes)[keyof typeof ExampleMessageTypes];

export type ClickPosition = {
    x: number;
    y: number;
};

export interface ImageSearchMessage {
    id: string;
    targetId: number;
    clickPosition?: ClickPosition;
    imageURL?: string;
    mediaType?: string;
    supportsDeepSearch: boolean;
    goDeepSearch: boolean;
    supportsDeepSearchModifier: boolean;
    deepSearchBigger: boolean;
    deepSearchBiggerLimit: number;
    frameId: number;
    frameUrl?: string;
    tabId: number;
    tabUrl?: string;
    fetchMode: string;
    nodeName?: string;
}

export type ImageSearchMessageResponse = {
    id: string;
    imageURL: string;
    mediaType: string;
    targetId: number;
    supportsDeepSearch: boolean;
    goDeepSearch: boolean;
    supportsDeepSearchModifier: boolean;
    deepSearchBigger: boolean;
    deepSearchBiggerLimit: number;
    frameId: number;
    frameUrl: string;
    tabId: number;
    tabUrl: string;
    fetchMode: string;
    source: string;
    context: string;
    nativeWidth: number;
    nativeHeight: number;
    naturalWidth: number;
    naturalHeight: number;
    x: number;
    y: number;
    srcset: string;
    crossOrigin: string;
    referrerPolicy: string;
    baseURI: string;
    jpegURL?: string;
    imageType?: string;
    proxyType?: string;
};

export interface ExampleMessageTypeMap {
    [ExampleMessageTypes.EXIF_DATA_READY]: {
        request: ExifReadyMessage;
        response: ImageSearchMessageResponse;
    };
    [ExampleMessageTypes.FETCH_XIFR_RESOURCE]: {
        request: FetchXifrResourceRequestX;
        response: FetchXifrResourceResponseX;
    };
    [ExampleMessageTypes.FETCH_XIFR_RESOURCE2]: {
        request: FetchXifrResourceRequestX;
        response: ExifDataDTOResponse;
    };
    [ExampleMessageTypes.SAVE_IMAGE_TO_COLLECTION]: {
        request: ExifReadyMessage;
        response: ImageSearchMessageResponse;
    };
    [ExampleMessageTypes.SHADOW_DOM_TEST]: {
        request: void;
        response: void;
    };
    [ExampleMessageTypes.IMAGE_SEARCH]: {
        request: ImageSearchMessage;
        response: ImageSearchMessageResponse;
    };
}


export type ExifDataDTOResponse = {
    data?: any;
    info?: string;
    properties?: any;
    error?: any;
}

export type ExampleAppMessageTypeMap = BaseMessageTypeMap &
    ExampleMessageTypeMap & {
        // Add index signature to allow for string indexing
        [key: string]: { request: any; response: any };
    };
export type AllMessageTypes =
    | keyof BaseMessageTypeMap
    | keyof ExampleMessageTypeMap;
