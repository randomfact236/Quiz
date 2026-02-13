# Port Allocation Plan for AI Quiz Project

**Version:** 2.0
**Last Updated:** 2026-02-13
**Status:** Active Planning
**Framework:** Next.js 15 + NestJS 10 + PostgreSQL + Redis + RabbitMQ
**Quality Target:** Enterprise Grade (10/10) - 99.99% uptime, SOC 2 ready

## Port Scan Results (Currently Occupied Ports)

### System Ports (Windows Services):
- **135**: RPC Endpoint Mapper (PID: 1832)
- **445**: SMB File Sharing (PID: 4)
- **139**: NetBIOS Session Service (PID: 4)
- **49664-49675**: Windows System Services (various PIDs)

### Application Ports (Currently In Use):
- **3000**: Development server (PID: 56504)
- **3003**: Development server (PID: 3432)
- **5040**: Logstash (PID: 11408)
- **7680**: Neo4j Graph Database (PID: 28904)
- **8123**: Local service (PID: 5056)
- **8884**: Local service (PID: 4)
- **11810**: Local service (PID: 28320)
- **57744**: Local service (PID: 26124)

### Available Port Ranges:
- **3001-3002**: Legacy protected ports (avoided)
- **3010-3011**: Available for frontend services
- **4000-4999**: Generally available for applications
- **5000-5999**: Available for development services
- **8000-8999**: Available for web services
- **9000-9999**: Available for APIs and microservices

## AI Quiz Project Port Allocation

### Frontend Services
- **Port 3010**: Next.js Development Server
  - **Service**: AI Quiz Frontend (Next.js 15)
  - **Protocol**: HTTP
  - **Environment**: Development
  - **Access**: Local development (http://localhost:3010)
  - **Load Balancer**: nginx on port 80 (production)

- **Port 3011**: Next.js Production Preview
  - **Service**: AI Quiz Frontend Preview
  - **Protocol**: HTTP
  - **Environment**: Staging/Preview
  - **Access**: Local preview builds

### Backend Services
- **Port 4000**: NestJS API Server
  - **Service**: AI Quiz Backend API (NestJS 10)
  - **Protocol**: HTTP
  - **Environment**: Development
  - **Access**: API endpoints (http://localhost:4000/api)
  - **Load Balancer**: nginx on port 443 (production)

- **Port 4001**: NestJS Admin API
  - **Service**: Administrative API endpoints
  - **Protocol**: HTTP
  - **Environment**: Development
  - **Access**: Admin functions and system management

### Database Services
- **Port 5432**: PostgreSQL Database
  - **Service**: Primary relational database
  - **Protocol**: PostgreSQL
  - **Environment**: Development
  - **Access**: Database connections
  - **Security**: Localhost only, password authentication

- **Port 5434**: PostgreSQL Test Database
  - **Service**: Testing database instance
  - **Protocol**: PostgreSQL
  - **Environment**: Testing
  - **Access**: Automated tests and CI/CD

### Caching Services
- **Port 6379**: Redis Cache
  - **Service**: In-memory data store and cache
  - **Protocol**: Redis
  - **Environment**: Development
  - **Access**: Session storage, caching, pub/sub

- **Port 6381**: Redis Test Instance
  - **Service**: Testing Redis instance
  - **Protocol**: Redis
  - **Environment**: Testing
  - **Access**: Test data and cache operations

### Storage Services
- **Port 9002**: MinIO API
  - **Service**: Object storage API
  - **Protocol**: HTTP/HTTPS
  - **Environment**: Development
  - **Access**: File storage and retrieval

- **Port 9003**: MinIO Console
  - **Service**: MinIO web management interface
  - **Protocol**: HTTP
  - **Environment**: Development
  - **Access**: Admin interface for storage management

### Message Queue Services
- **Port 5674**: RabbitMQ AMQP
  - **Service**: Message broker (AMQP protocol)
  - **Protocol**: AMQP
  - **Environment**: Development
  - **Access**: Application message queuing

- **Port 15673**: RabbitMQ Management UI
  - **Service**: RabbitMQ web management interface
  - **Protocol**: HTTP
  - **Environment**: Development
  - **Access**: Admin interface (http://localhost:15673)
  - **Credentials**: Default (guest/guest) - change in production

- **Port 5673**: RabbitMQ Test Instance
  - **Service**: Testing message queue
  - **Protocol**: AMQP
  - **Environment**: Testing

### Monitoring and Observability
- **Port 9090**: Prometheus Metrics
  - **Service**: Metrics collection and monitoring
  - **Protocol**: HTTP
  - **Environment**: Development
  - **Access**: Metrics endpoint (/metrics)

- **Port 3004**: Grafana Dashboard
  - **Service**: Monitoring dashboards and visualization
  - **Protocol**: HTTP
  - **Environment**: Development
  - **Access**: Dashboard interface (http://localhost:3004)

- **Port 5601**: Kibana (ELK Stack)
  - **Service**: Log analysis and visualization
  - **Protocol**: HTTP
  - **Environment**: Development
  - **Access**: Log analysis interface

### Development Tools
- **Port 9229**: Node.js Debug Port
  - **Service**: JavaScript debugging for backend
  - **Protocol**: WebSocket
  - **Environment**: Development
  - **Access**: Chrome DevTools debugging

- **Port 9230**: Next.js Debug Port
  - **Service**: JavaScript debugging for frontend
  - **Protocol**: WebSocket
  - **Environment**: Development
  - **Access**: Chrome DevTools debugging

### Testing and Quality Assurance
- **Port 8080**: Test Coverage Reports
  - **Service**: Code coverage and test reports
  - **Protocol**: HTTP
  - **Environment**: Development
  - **Access**: Coverage reports interface

- **Port 8081**: E2E Test Runner
  - **Service**: End-to-end test execution
  - **Protocol**: HTTP
  - **Environment**: Testing
  - **Access**: Test runner interface

## Production Port Configuration

### Load Balancer Configuration
- **Port 80**: HTTP traffic (redirect to HTTPS)
- **Port 443**: HTTPS traffic (SSL/TLS)
- **Backend Distribution**:
  - Frontend: Next.js on internal ports
  - API: NestJS on internal ports
  - Static Assets: CDN distribution

### Database Security
- **No External Access**: Database ports blocked from internet
- **Internal Network Only**: Database access via private network
- **Connection Pooling**: Optimized connection management
- **SSL Encryption**: Encrypted database connections

### Monitoring Security
- **Internal Access Only**: Monitoring ports not exposed externally
- **Authentication Required**: Secure access to monitoring interfaces
- **Network Segmentation**: Monitoring traffic isolated from application traffic

## Port Management Guidelines

### Development Environment
- **Port Range**: 3000-4999 for application services
- **Port Range**: 8000-8999 for monitoring and tools
- **Documentation**: All ports documented in this plan
- **Conflicts**: Check port availability before assignment

### Production Environment
- **Standard Ports**: 80/443 for web traffic
- **Internal Ports**: Application-specific internal ports
- **Load Balancing**: Traffic distribution across multiple instances
- **Auto-scaling**: Dynamic port allocation for scaled instances

### Security Considerations
- **Firewall Rules**: Restrict access to necessary ports only
- **Network ACLs**: Control traffic at network level
- **Port Scanning**: Regular security scans for open ports
- **Access Logging**: Monitor and log port access attempts

### Maintenance Procedures
- **Port Monitoring**: Regular checks for port conflicts
- **Service Restart**: Procedures for service port management
- **Backup Access**: Alternative access methods during maintenance
- **Emergency Access**: Emergency port access procedures

## Implementation Checklist

### Development Setup
- [ ] Configure all development ports in docker-compose.yml
- [ ] Update package.json scripts with correct ports
- [ ] Configure environment variables for port assignments
- [ ] Test all services start on assigned ports

### Production Deployment
- [ ] Configure load balancer for port 80/443
- [ ] Set up internal port mappings for services
- [ ] Configure firewall rules for required ports
- [ ] Implement SSL/TLS for secure communications

### Monitoring Setup
- [ ] Configure monitoring for all service ports
- [ ] Set up alerts for port availability
- [ ] Implement health checks for all services
- [ ] Configure log aggregation for port-related events

## Risk Mitigation

### Port Conflicts
- **Regular Scanning**: Periodic port availability checks
- **Documentation**: Clear port ownership documentation
- **Conflict Resolution**: Procedures for resolving port conflicts
- **Alternative Ports**: Backup port assignments

### Security Risks
- **Port Hardening**: Minimize exposed ports in production
- **Access Control**: Implement proper authentication and authorization
- **Traffic Monitoring**: Monitor traffic on all open ports
- **Vulnerability Scanning**: Regular security assessments

### Scalability Considerations
- **Port Ranges**: Plan for future service additions
- **Load Balancing**: Design for horizontal scaling
- **Service Discovery**: Implement service discovery mechanisms
- **Dynamic Allocation**: Consider dynamic port allocation for microservices