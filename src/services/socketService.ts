import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;

  private constructor() {
    // Initialize socket connection
    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Setup listeners
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(userId: string) {
    if (this.socket && !this.socket.connected) {
      this.socket.auth = { userId };
      this.socket.connect();
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  public subscribe<T>(event: string, callback: (data: T) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  public unsubscribe(event: string) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  public emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

export const socketService = SocketService.getInstance();