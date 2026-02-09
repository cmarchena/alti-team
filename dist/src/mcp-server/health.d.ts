export interface HealthCheck {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    version: string;
    uptime: number;
    checks: {
        database: boolean;
        repositories: boolean;
    };
}
export declare function getUptime(): number;
export declare function updateServerStartTime(): void;
interface HealthCheckResult {
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}
export declare function performHealthCheck(): Promise<HealthCheck>;
export declare function createHealthCheckHandler(): () => Promise<HealthCheckResult>;
export {};
