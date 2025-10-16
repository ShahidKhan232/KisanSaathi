import { Server as HttpServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../middleware/auth.js';

export class WebSocketManager {
  private io: Server;
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authenticate socket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          throw new Error('Authentication error');
        }
        
        const decoded = await verifyToken(token);
        socket.data.userId = decoded.userId;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.userId;
      
      // Track user connections
      this.addUserSocket(userId, socket.id);

      socket.on('disconnect', () => {
        this.removeUserSocket(userId, socket.id);
      });

      // Handle scheme application updates
      socket.on('scheme:apply', async (data) => {
        // Broadcast to all connected devices of the same user
        this.emitToUser(userId, 'scheme:status', {
          schemeId: data.schemeId,
          status: 'applied',
          timestamp: new Date().toISOString()
        });
      });

      // Handle document uploads
      socket.on('document:upload', async (data) => {
        this.emitToUser(userId, 'document:status', {
          documentId: data.documentId,
          status: data.status,
          timestamp: new Date().toISOString()
        });
      });

      // Handle profile updates
      socket.on('profile:update', async (data) => {
        this.emitToUser(userId, 'profile:update', {
          ...data,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  private addUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)?.add(socketId);
  }

  private removeUserSocket(userId: string, socketId: string) {
    this.userSockets.get(userId)?.delete(socketId);
    if (this.userSockets.get(userId)?.size === 0) {
      this.userSockets.delete(userId);
    }
  }

  public emitToUser(userId: string, event: string, data: any) {
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  public broadcastSchemeUpdate(schemeId: string, update: any) {
    this.io.emit('scheme:update', { schemeId, ...update });
  }
}