import { Connection } from 'jsforce';
export interface ToolHandler {
    name: string;
    description: string;
    inputSchema: Record<string, any>;
    handler: (conn: Connection, args: any) => Promise<any>;
}
export declare const tools: ToolHandler[];
