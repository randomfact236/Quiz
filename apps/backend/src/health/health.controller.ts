import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import {
  MEMORY_HEAP_LIMIT_BYTES,
  MEMORY_RSS_LIMIT_BYTES,
  DISK_THRESHOLD_PERCENT,
} from '../common/constants/app.constants';

/**
 * Liveness check response
 */
interface LivenessResponse {
  status: 'ok';
  timestamp: string;
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check overall health status' })
  check(): Promise<HealthCheckResult> {
    const isWindows = process.platform === 'win32';
    const diskPath = isWindows ? 'C:\\' : '/';
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', MEMORY_HEAP_LIMIT_BYTES),
      () => this.memory.checkRSS('memory_rss', MEMORY_RSS_LIMIT_BYTES),
      () => this.disk.checkStorage('disk', { path: diskPath, thresholdPercent: DISK_THRESHOLD_PERCENT }),
    ]);
  }

  @Get('liveness')
  @ApiOperation({ summary: 'Kubernetes liveness probe' })
  liveness(): LivenessResponse {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('readiness')
  @HealthCheck()
  @ApiOperation({ summary: 'Kubernetes readiness probe' })
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
