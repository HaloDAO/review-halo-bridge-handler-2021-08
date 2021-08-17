# Serverless Bridge Handler

A serverless service to handle emitted contract events from event broker (HAL)

## Local Setup
Make sure to provide the .env values get from 1Password
```bash
npm install
docker-compose up -d # optionally spin local DB for dev
npm run local # use serverless offline to test locally.
```

The expected result should be similar to:

```
Serverless: Compiling with Typescript...
Serverless: Using local tsconfig.json
Serverless: Typescript compiled.
Serverless: Packaging service...
Serverless: Excluding development dependencies...
Serverless: Uploading CloudFormation file to S3...
Serverless: Uploading artifacts...
Serverless: Uploading service aws-node-rest-api-typescript.zip file to S3 (1.86 MB)...
Serverless: Validating template...
Serverless: Updating Stack...
Serverless: Checking Stack update progress...
......................................
Serverless: Stack update finished...
Service Information
service: serverless-bridge-handler
stage: dev
region: us-east-1
stack: aws-node-rest-api-typescript-dev
resources: 32
api keys:
  None
endpoints:
  POST - https://xxxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/deposit
functions:
  create: serverless-bridge-handler-dev-handleDepositEvent
```

## Invoking Lambda Functions Locally

```bash
serverless invoke local --function handleDepositEvent
```


Which should result in:

```bash
Serverless: Compiling with Typescript...
Serverless: Using local tsconfig.json
Serverless: Typescript compiled.

{
    "statusCode": 200,
    "body": "{\"code\":0,\"message\":\"success\"}"
}
```

## Deploying
Make sure to store your AWS IAM credentials at ~/.aws/credentials
```bash
[halodao]
aws_access_key_id=<your_aws_access_key_id>
aws_secret_access_key=<your_aws_access_key_id>
```
Then to deploy to AWS
```bash
export AWS_PROFILE=halodao # use halodao AWS profile
npm run deploy
```

## Terminating
To remove deployed lambda function in AWS
```bash
export AWS_PROFILE=halodao # use halodao AWS profile
npm run remove
```

## Usage

send an HTTP request directly to the endpoint using a tool like curl

```
curl https://xxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/deposits
```

## Scaling

By default, AWS Lambda limits the total concurrent executions across all functions within a given region to 100. The default limit is a safety limit that protects you from costs due to potential runaway or recursive functions during initial development and testing. To increase this limit above the default, follow the steps in [To request a limit increase for concurrent executions](http://docs.aws.amazon.com/lambda/latest/dg/concurrent-executions.html#increase-concurrent-executions-limit).
