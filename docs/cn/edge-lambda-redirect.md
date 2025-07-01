# Edge Lambda 动态重定向服务

## 业务背景
Atlassian 客服部门需要将知识库从 Confluence 整体迁移到 Contentful。在这一过程中，我们需要保证原本的 confluence 链接仍能正常访问，并自动重定向到 Contentful

## 系统设计
![](/img/cac-redirect.png)

## 技术栈
- SQS
- Lambda (nodejs)
    - [Lambda PowerTools](https://github.com/aws-powertools/powertools-lambda-typescript) for logging
    - [middy](https://www.npmjs.com/package/@middy/core) for dependency injection
- Lambda@Edge (nodejs)
- CloudFront (for edge functions at viewer response)
- IAM Roles (for cross-account resource access)
- DynamoDB Global Table (for Lambda@Edge)
- TerraForm (for team-owned AWS account)

## 技术选型
### 为什么不用 Cloudfront Function
CloudFront KVS is limited to 5MB, not enough to store all the redirections.
### 为什么不用 Confluence Plugin
Performance decline for Confluence.
### 什么是 Micros AWS
See [this article](https://www.atlassian.com/trust/reliability/cloud-architecture-and-operational-practices#cloud-infrastructure).