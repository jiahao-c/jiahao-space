
# GraphQL 性能优化


![](/img/symphony.jpeg) 

在 Atlassian 内部的 “客服工单队列管理系统” (Support Ticket Queue Management Console) 中，大量的 API 请求是通过 GraphQL 实现的，这部分具体的技术栈是：

- 前端: Apollo Client
- GraphQL IDE（方便开发时快速测试 GQL 语句和查询 schema）: [GraphiQL](https://team.atlassian.com/gateway/api/graphql)
- 后端: Netflix DGS

GraphQL 中常见的问题之一是 n+1 问题，以这个 query 为例：
```graphql
query GetTickets {
  tickets {
    ticketKey
    ticketTitle
    assignee {
        agentStatus
    }
  }
}
```
当后端执行`GetTickets`这个 query 时，如果不对 assignee 的 resolver 做优化，那么对于每一个 ticket，后端都会单独执行一遍 assignee 信息的查询，增加数据库负担。


为了解决这个问题，我们可以在后端中使用 DataLoader，这样就可以将 assignee 的查询 batch 为一次 ：

```java
import org.dataload.BatchLoader;
import com.netflix.graphql.dgs.DgsDataLoader;

@DgsDataLoader(name = "agentStatus")
public class AgentStatusDataLoader implements BatchLoader<User, AgentStatus> {
    ....
    @Override
    List<AgentStatus> getBatchData(List<User> users) {
        return agentService.getAgentStatus(users.stream()
            .map(User::getStatus)
            .collect(toList());
        )
    }
}
```

然后，我们还可以通过启用 ApolloClient 的 InMemoryCache 功能，使得前端可以缓存 GraphQL API 的查询结果，减少不必要的新增 HTTP 请求：

```typescript showLineNumbers
import { InMemoryCache, ApolloClient } from '@apollo/client';

const client = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
        Agent: {
             keyFields: ["email"], //unique identifier for an agent
        }
    }
  })
});
```