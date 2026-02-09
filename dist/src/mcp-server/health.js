"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUptime = getUptime;
exports.updateServerStartTime = updateServerStartTime;
exports.performHealthCheck = performHealthCheck;
exports.createHealthCheckHandler = createHealthCheckHandler;
const index_js_1 = require("../lib/repositories/index.js");
const logger_js_1 = require("./logger.js");
let serverStartTime = Date.now();
function getUptime() {
    return Math.floor((Date.now() - serverStartTime) / 1000);
}
function updateServerStartTime() {
    serverStartTime = Date.now();
}
async function performHealthCheck() {
    const checks = {
        database: false,
        repositories: false,
    };
    try {
        const repos = (0, index_js_1.getRepositories)();
        checks.repositories = true;
        try {
            const result = await repos.users.findById('health-check');
            if (result && typeof result === 'object' && 'id' in result) {
                checks.database = true;
            }
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('not_found')) {
                checks.database = true;
            }
            else {
                logger_js_1.logger.warn('Database health check failed', { error: String(error) });
            }
        }
    }
    catch (error) {
        logger_js_1.logger.error('Repository health check failed', { error: String(error) });
    }
    const allHealthy = Object.values(checks).every(Boolean);
    return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: getUptime(),
        checks,
    };
}
function createHealthCheckHandler() {
    return async () => {
        const health = await performHealthCheck();
        const isHealthy = health.status === 'healthy';
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(health, null, 2),
                },
            ],
            isError: !isHealthy,
        };
    };
}
