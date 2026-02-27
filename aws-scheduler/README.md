# FintechOps AWS Scheduler

Serverless scheduled prompts infrastructure using AWS SAM.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React App     │────▶│  API Gateway    │────▶│ Lambda Functions│
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                        │
                        JWT Authorizer                  │
                               │                        ▼
                               │               ┌─────────────────┐
                               │               │    DynamoDB     │
                               │               └─────────────────┘
                               │                        │
                               ▼                        │
                    ┌─────────────────┐                 │
                    │  EventBridge    │─────────────────┘
                    │   Scheduler     │        (triggers execute-prompt)
                    └─────────────────┘
                               │
                               ▼
                    ┌─────────────────┐
                    │    Groq API     │
                    └─────────────────┘
                               │
                               ▼
                    ┌─────────────────┐
                    │   AWS SES       │──────▶ Email
                    └─────────────────┘
```

## Prerequisites

1. **AWS CLI** configured with credentials
2. **AWS SAM CLI** installed
3. **Node.js 18+** for Lambda functions
4. **Docker** (for SAM build)

## Quick Start

### 1. Set Environment Variables

```bash
export AWS_REGION=us-east-1
export GROQ_API_KEY=gsk_your_api_key
export JWT_SECRET=your_jwt_secret_matching_backend
export SES_FROM_EMAIL=noreply@yourdomain.com
export FRONTEND_URL=https://yourdomain.com
```

### 2. Verify SES Email

```bash
# Verify sender email (required for SES)
aws ses verify-email-identity --email-address noreply@yourdomain.com

# For production, verify your domain instead
aws ses verify-domain-identity --domain yourdomain.com
```

### 3. Deploy

```bash
chmod +x deploy.sh
./deploy.sh dev  # or 'prod' for production
```

### 4. Update Frontend

After deployment, update your frontend API configuration:

```javascript
// frontend/src/config/api.js
export const SCHEDULER_API_URL = 'https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/v1';
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /schedules | Create new scheduled prompt |
| GET | /schedules | List all user schedules |
| PUT | /schedules/{id} | Update schedule |
| DELETE | /schedules/{id} | Delete schedule |
| POST | /schedules/{id}/toggle | Toggle active/paused |
| GET | /schedules/{id}/results | Get execution results |

## Authentication

All endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

The JWT should contain:
- `userId`: User's unique ID
- `email`: User's email (for sending results)

## DynamoDB Schema

Single-table design with composite keys:

### Schedules
- **PK**: `USER#{userId}`
- **SK**: `SCHEDULE#{scheduleId}`

### Results
- **PK**: `SCHEDULE#{scheduleId}`
- **SK**: `RESULT#{timestamp}#{resultId}`

## EventBridge Schedules

Each schedule creates an EventBridge Scheduler rule:
- Name: `fintechops-{userId}-{scheduleId}`
- Cron expression based on frequency
- Target: execute-prompt Lambda

## Cost Estimates

| Service | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| Lambda | 1M requests/month | $0.20/1M requests |
| DynamoDB | 25 GB storage | $0.25/GB/month |
| API Gateway | 1M calls/month | $3.50/1M calls |
| EventBridge | 14M invocations/month | $1.00/1M |
| SES | 62K emails/month (from EC2) | $0.10/1K emails |

Typical cost for 100 users with 5 schedules each, daily runs: **< $5/month**

## Troubleshooting

### Lambda Errors

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/fintechops-scheduler-execute-prompt --follow
```

### SES Not Sending Emails

1. Verify email is confirmed in SES
2. Check if SES is in sandbox mode (only verified emails)
3. Request production access for unrestricted sending

### EventBridge Not Triggering

1. Check schedule state (ENABLED vs DISABLED)
2. Verify cron expression is valid
3. Check Lambda execution role permissions

## Local Testing

```bash
# Invoke Lambda locally
sam local invoke CreateScheduleFunction -e events/create-schedule.json

# Start local API
sam local start-api
```

## Cleanup

```bash
# Delete the stack
aws cloudformation delete-stack --stack-name fintechops-scheduler-dev

# Or use SAM
sam delete --stack-name fintechops-scheduler-dev
```

## Files Structure

```
aws-scheduler/
├── template.yaml          # SAM infrastructure template
├── deploy.sh              # Deployment script
├── samconfig.toml         # SAM deployment config
├── README.md              # This file
└── lambda/
    ├── authorizer/        # JWT token verification
    ├── create-schedule/   # Create new schedule
    ├── get-schedules/     # List user schedules
    ├── update-schedule/   # Update existing schedule
    ├── delete-schedule/   # Delete schedule
    ├── toggle-schedule/   # Enable/disable schedule
    ├── get-results/       # Get execution history
    └── execute-prompt/    # Run prompt & send email
```
