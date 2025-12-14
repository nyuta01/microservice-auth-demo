# Documentation

This directory contains project design documentation.

## Main Documents

### Architecture
- [Architecture Design](./architecture.md) - Overall system architecture design
- [Service Details](./services.md) - Detailed specifications for each service
- [Port Assignment](./port-assignment.md) - Port number assignment rules

### Authentication & Authorization Design
- [Permission Design](./permission-design.md) - Organization/Workspace 2-tier permission design
- [Role Design](./role-design.md) - Workspace/Organization role design

### Reference Materials
- [Naming Conventions](./naming-conventions.md) - Naming conventions and rules
- [Organization/Workspace](./organization-workspace.md) - Multi-tenant structure explanation

## Quick Start

See the [README.md](../README.md) in the root directory for detailed setup instructions.

## Service List

### Core Services
| Service | Port | Role |
|---------|------|------|
| AuthN API | 10000 | Authentication & user management (better-auth) |
| AuthZ API | 10001 | Authorization & organization/workspace management |

### Business Services
| Service | API | Web | Role |
|---------|-----|-----|------|
| Task | 10100 | 20100 | Task management |
| Document | 10101 | 20101 | Document management |

### Admin Services
| Service | API | Web | Role |
|---------|-----|-----|------|
| Console | 10200 | 20200 | Organization/Workspace management (for org:admin) |
| System Admin | 10201 | 20201 | System-wide management (for super-admin) |

## Role System

### User Role (user.role)
Managed in AuthN API's `user` table. System-wide permission level.

| Role | Description |
|------|-------------|
| `admin` | System administrator (can access all Organizations/Workspaces) |
| `user` / `null` | Regular user (permissions managed via Organization/Workspace membership) |

### Organization Roles (organization_members)
Managed in AuthZ API. Permission level within an Organization.

| Role | Description | Console Access |
|------|-------------|----------------|
| `org:owner` | Organization owner | Allowed |
| `org:admin` | Organization admin | Allowed |
| `org:member` | Organization member | Not allowed (Workspace only) |

### Workspace Roles (workspace_members)
Managed in AuthZ API. Permission level within a Workspace.

| Role | Description |
|------|-------------|
| `workspace:admin` | WS admin (full permissions) |
| `workspace:member` | WS member (read/write) |
| `workspace:viewer` | WS viewer (read only) |
