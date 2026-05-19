import  {createServer} from 'node:http';
import { createApp } from "./app.js";
import { assertDatabaseConnection } from "./db/db.js";
import { logger } from "./lib/logger.js";
import { env } from './config/env.js';

async function bootstrap(){
    try{

        await assertDatabaseConnection();
        const app  =  createApp();
        const server  = createServer(app);
        const port = Number(env.PORT) || 5000;

        server.listen(port,()=>{
            logger.info(`server is now listening on port ${port} `)
        })


    }catch(err ){
        logger.error(`Failed to start the server, ${(err as Error).message }`);
        process.exit(1);
    }
}

bootstrap();