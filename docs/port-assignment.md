# Port Assignment Rules

## Overview

Defines rules for consistent port number assignment for services and databases.

## Port Number Rules

### API Services: 10000s (Core), 10100s (Business API), 10200s (Admin API)

| Service | Port | Description |
|---------|------|-------------|
| AuthN API | 10000 | Authentication & user management |
| AuthZ API | 10001 | Authorization & organization management |
| Task API | 10100 | Task management API |
| Document API | 10101 | Document management API |
| Schedule API | 10102 | Schedule management API |
| Console API | 10200 | Organization/Workspace integrated management API |
| System Admin API | 10201 | System admin management API |

**Rules**:
- **Core services**: 10000-10009 (sequential)
- **Business API**: 10100-10109 (sequential per resource)
- **Admin API**: 10200-10209 (sequential)

**Note**: Ports 4000s, 7000s, 10000s may be used by other systems, so we use ports above 10000. This avoids port conflicts and maintains consistency.

### Web Services: 20000s (Business Web), 20200s (Admin Web)

| Service | Port | Description |
|---------|------|-------------|
| Task Web | 20100 | Task management web app |
| Document Web | 20101 | Document management web app |
| Schedule Web | 20102 | Schedule management web app |
| Console Web | 20200 | Organization/Workspace integrated management console |
| System Admin Web | 20201 | System admin management UI |

**Rules**:
- **Business Web**: 20100-20109 (sequential per resource, corresponds to API)
- **Admin Web**: 20200-20209 (sequential)

**Note**: Port 3000s are used by other systems, so we use ports above 20000.

### Databases: 6000s

| Database | Port | Description |
|----------|------|-------------|
| auth_db | 6000 | AuthN API database |
| authz_db | 6001 | AuthZ API database |
| task_db | 6010 | Task API database |
| document_db | 6011 | Document API database |
| schedule_db | 6012 | Schedule API database |
| system_admin_db | 6021 | System Admin API database |

**Rules**:
- Core DB: 6000-6009 (sequential, corresponds to services)
- Business DB: 6010-6019 (sequential per resource, corresponds to API)
- Admin DB: 6020-6029 (sequential, corresponds to services)

**Note**: Using 6000s, away from PostgreSQL default port (5432), avoids conflicts with other systems.

## Port Mapping Table

### Service and Database Correspondence

| Service | Service Port | Database | DB Port |
|---------|--------------|----------|---------|
| AuthN API | 10000 | auth_db | 6000 |
| AuthZ API | 10001 | authz_db | 6001 |
| Task API | 10100 | task_db | 6010 |
| Task Web | 20100 | - | - |
| Document API | 10101 | document_db | 6011 |
| Document Web | 20101 | - | - |
| Schedule API | 10102 | schedule_db | 6012 |
| Schedule Web | 20102 | - | - |
| Console Web | 20200 | - | - |
| Console API | 10200 | - | - |
| System Admin API | 10201 | system_admin_db | 6021 |
| System Admin Web | 20201 | - | - |

## Change Rationale

### Previous Port Numbers (Deprecated)

**Service ports**:
- AuthZ API: 4002 → 4001 (unified to sequential)
- System Admin API: 4030 → 4021 (unified to sequential)
- System Admin Web: 3030 → 20201 (unified to sequential)

**Database ports**:
- auth_db: 5432 → 6000 (unique number away from PostgreSQL default)
- authz_db: 5433 → 6001
- task_db: 5436 → 6010
- document_db: 5437 → 6011
- schedule_db: 5438 → 6012
- system_admin_db: 5440 → 6021

**Reasons for change**:
1. **Consistency**: Sequential numbering per service for consistency
2. **Uniqueness**: Database ports changed to 6000s, avoiding PostgreSQL default port (5432) and other system conflicts
3. **Grouping**: Classified into 3 groups: core/business/admin
4. **Extensibility**: Sequential numbering makes adding new services easy

## Implementation Examples

### docker-compose.yml

```yaml
services:
  # Core service DBs
  db-auth:
    ports:
      - "6000:5432"
    environment:
      POSTGRES_DB: auth_db

  db-authz:
    ports:
      - "6001:5432"
    environment:
      POSTGRES_DB: authz_db

  # Business service DBs
  db-task:
    ports:
      - "6010:5432"
    environment:
      POSTGRES_DB: task_db

  db-document:
    ports:
      - "6011:5432"
    environment:
      POSTGRES_DB: document_db

  db-schedule:
    ports:
      - "6012:5432"
    environment:
      POSTGRES_DB: schedule_db

  # Admin service DBs
  db-system-admin:
    ports:
      - "6021:5432"
    environment:
      POSTGRES_DB: system_admin_db
```

### Environment Variables

```bash
# Core services
SERVICE_URL_AUTH=http://localhost:10000
SERVICE_URL_AUTHZ=http://localhost:10001

# Business APIs
SERVICE_URL_TASK_API=http://localhost:10100
SERVICE_URL_DOCUMENT_API=http://localhost:10101
SERVICE_URL_SCHEDULE_API=http://localhost:10102

# Admin services
SERVICE_URL_CONSOLE_API=http://localhost:10200
SERVICE_URL_SYSTEM_ADMIN_API=http://localhost:10201

# Database connections
DATABASE_URL_AUTH=postgresql://user:password@localhost:6000/auth_db
DATABASE_URL_AUTHZ=postgresql://user:password@localhost:6001/authz_db
DATABASE_URL_TASK=postgresql://user:password@localhost:6010/task_db
DATABASE_URL_DOCUMENT=postgresql://user:password@localhost:6011/document_db
DATABASE_URL_SCHEDULE=postgresql://user:password@localhost:6012/schedule_db
DATABASE_URL_SYSTEM_ADMIN=postgresql://user:password@localhost:6021/system_admin_db
```

## Future Extensions

### Adding New Resources

**Example: Add Note API/Web**

| Service | Port | Database | DB Port |
|---------|------|----------|---------|
| Note API | 10103 | note_db | 6013 |
| Note Web | 20103 | - | - |

### Adding New Admin Services

**Example: Add Audit API**

| Service | Port | Database | DB Port |
|---------|------|----------|---------|
| Audit API | 10202 | audit_db | 6022 |
