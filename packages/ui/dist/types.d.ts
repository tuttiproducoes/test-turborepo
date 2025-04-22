export interface StorageUpdateEvent<T = any> extends MessageEvent {
    data: {
        type: 'STORAGE_UPDATE' | 'PRODUCTS_UPDATED';
        key: string;
        value?: string;
        produtos?: T;
    };
}
