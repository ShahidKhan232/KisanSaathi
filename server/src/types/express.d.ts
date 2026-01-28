import 'express';

declare global {
    namespace Express {
        interface Application {
            api_routes_registered?: boolean;
        }
    }
}
