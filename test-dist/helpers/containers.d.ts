import { StartedTestContainer } from 'testcontainers';
import type { ConnectionConfig } from '../../dist/utils/types.js';
export interface TestContainerInfo {
    container: StartedTestContainer;
    config: ConnectionConfig;
}
export declare class TestContainers {
    private containers;
    startPostgreSQL(): Promise<TestContainerInfo>;
    startMySQL(): Promise<TestContainerInfo>;
    startMariaDB(): Promise<TestContainerInfo>;
    startMSSQL(): Promise<TestContainerInfo>;
    startAll(): Promise<Map<string, TestContainerInfo>>;
    stopAll(): Promise<void>;
    getConfig(type: string): ConnectionConfig | undefined;
    getAllConfigs(): Map<string, ConnectionConfig>;
}
export declare function getTestContainers(): Promise<TestContainers>;
export declare function cleanupTestContainers(): Promise<void>;
//# sourceMappingURL=containers.d.ts.map