# Redirection using Edge Lambda and DynamoDB

## System Design Overview
![](/img/cac-redirect.png)

## Technologies Used
- SQS
- Lambda (nodejs)
    - [Lambda PowerTools](https://github.com/aws-powertools/powertools-lambda-typescript) for logging
    - [middy](https://www.npmjs.com/package/@middy/core) for dependency injection
- Lambda@Edge (nodejs)
- CloudFront (for edge functions at viewer response)
- IAM Roles (for cross-account resource access)
- DynamoDB Global Table (for Lambda@Edge)
- TerraForm (for team-owned AWS account)

## Alternatives Considered to perform redirection
###  Why not CloudFront function? 
CloudFront KVS is limited to 5MB, not enough to store all the redirections.
### Why not use a Confluence Plugin?
Performance decline for Confluence.
### What is Micros?
See [this article](https://www.atlassian.com/trust/reliability/cloud-architecture-and-operational-practices#cloud-infrastructure).