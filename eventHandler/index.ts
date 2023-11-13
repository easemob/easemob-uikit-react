import { AgoraChat } from 'agora-chat';
export type EventName = 'joinChatRoom' | 'leaveChatroom' | 'reportMessage';

export type EventHandlerData = {
  [key in EventName]?: {
    success?: () => void;
    error?: (err: AgoraChat.ErrorEvent) => void;
  };
};

export class EventHandler {
  handlerData: { [key: string]: EventHandlerData } = {};
  private static instance: EventHandler;
  public static getInstance(): EventHandler {
    if (!EventHandler.instance) {
      EventHandler.instance = new EventHandler();
    }
    return EventHandler.instance;
  }

  constructor() {
    this.handlerData = {};
  }

  addEventHandler(eventHandlerId: string, eventHandler: EventHandlerData) {
    this.handlerData[eventHandlerId] = eventHandler;
  }

  removeEventHandler(eventHandlerId: string) {
    delete this.handlerData[eventHandlerId];
  }

  dispatchSuccess(eventName: EventName) {
    Object.keys(this.handlerData).forEach(key => {
      if (this.handlerData[key]?.[eventName] && this.handlerData[key][eventName]?.success) {
        this.handlerData[key][eventName]?.success?.();
      }
    });
  }

  dispatchError(eventName: EventName, error: AgoraChat.ErrorEvent) {
    Object.keys(this.handlerData).forEach(key => {
      if (this.handlerData[key]?.[eventName] && this.handlerData[key][eventName]?.error) {
        this.handlerData[key][eventName]?.error?.(error);
      }
    });
  }
}

export const eventHandler = EventHandler.getInstance();
