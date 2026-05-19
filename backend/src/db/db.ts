import { Pool, QueryResult, QueryResultRow } from "pg";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

export const pool  = new Pool({
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    database: env.DB_NAME,
    user:env.DB_USER,
    password: env.DB_PASSWORD
});

export async function query<T extends QueryResultRow = QueryResultRow>(text:string,params?: unknown[]): Promise<QueryResult<T>> {
    return await pool.query<T>(text,params as any[]);
}

export async function assertDatabaseConnection(){
    try{
        await pool.query("SELECT 1;");
        logger.info("connected to postgres");
    }catch(err){
        throw err;
    }
}
