# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains comprehensive documentation for a **Quality Management System (KYS - Kalite Yönetim Sistemi)** meta-prompt project. The documentation is written in Turkish and serves as a detailed specification for developing a complete QMS software solution following ISO 9001 standards.

## Architecture and Structure

The project follows a **technology-agnostic approach** designed to be implementable in any modern tech stack. The system is based on a **modular architecture** with the following key components:

### Core Modules
- **Document Management** - Controlled document lifecycle with approval workflows
- **CAPA (Corrective and Preventive Actions)** - Nonconformity management and root cause analysis  
- **Internal Audit Management** - Audit planning, execution, and follow-up
- **Risk and Opportunity Management** - Risk assessment and mitigation planning
- **Training and Competency Management** - Employee skill tracking and training programs
- **Customer Relations Management** - Complaint handling and feedback processing
- **Supplier Management** - Supplier evaluation and performance monitoring
- **Equipment Management** - Calibration and maintenance tracking
- **Management Review** - Executive oversight and system evaluation
- **Continuous Improvement** - Performance monitoring and improvement initiatives

### Database Design
The system uses a **normalized relational database structure** (3NF) with:
- Comprehensive entity-relationship modeling
- Proper foreign key constraints for data integrity
- Audit trails with created_at/updated_at timestamps
- Role-based access control through Users/Roles/Permissions tables

### Process Flow Management
All business processes are documented using **Mermaid.js flowcharts** that define:
- Step-by-step workflows
- Decision points and conditional logic
- Role-based task assignments
- Integration points between modules

## Key Documentation Files

- `KYS_META_PROMPT.md` - **Primary specification document** (43K+ tokens) containing complete system requirements
- `kys_requirements_analysis.md` - **Business requirements analysis** with detailed module specifications
- `kys_database_schema.md` - **Database schema definitions** with table structures and relationships
- `kys_process_diagrams.md` - **Process flow diagrams** in Mermaid.js format
- `meta_prompt_structure_design.md` - **Structural design document** for the meta-prompt organization

## Development Guidelines

### Database Schema Implementation
When implementing the database schema from `kys_database_schema.md`:
- Follow the exact table structures and relationships defined
- Implement proper foreign key constraints
- Use the specified data types and field lengths
- Include audit trail fields (created_at, updated_at) in all main tables

### Process Implementation
When implementing business processes:
- Reference the Mermaid.js diagrams in `kys_process_diagrams.md`
- Ensure all decision points and workflow branches are handled
- Implement proper role-based access controls for each process step
- Include notification and task assignment capabilities

### AI Integration
The system includes comprehensive **AI assistant capabilities**:
- Natural language querying of system data
- Intelligent document analysis and summarization
- Process guidance and recommendations
- Risk assessment assistance
- Trend analysis and insights generation

### User Interface Design
Follow the UX principles defined in the meta-prompt:
- **Responsive design** supporting desktop, tablet, and mobile
- **Role-based navigation** showing only relevant modules to each user
- **Dashboard-driven approach** with key metrics and pending tasks
- **Accessibility compliance** following WCAG guidelines
- **Multilingual support** with Turkish as primary language

## System Integration Requirements

The QMS is designed to integrate with:
- **External document systems** for controlled document storage
- **LDAP/Active Directory** for user authentication
- **Email systems** for notifications and workflow alerts
- **Reporting tools** for advanced analytics and dashboards
- **Mobile applications** for field data collection and approvals

## Important Implementation Notes

- The system must support **offline capability** for critical functions like data collection
- All user actions require **audit logging** for compliance purposes
- **Document version control** must maintain complete revision history
- **Workflow engine** should support configurable approval processes
- **Notification system** must handle email, in-app, and mobile push notifications

## Technology Recommendations

While technology-agnostic, the architecture supports:
- **Modern web frameworks** (React, Vue.js, Angular for frontend)
- **RESTful APIs** with proper HTTP status codes and error handling
- **Relational databases** (PostgreSQL, MySQL, SQL Server)
- **Document storage** (file system, cloud storage, or database BLOBs)
- **Caching layers** for performance optimization
- **Message queues** for background processing and notifications