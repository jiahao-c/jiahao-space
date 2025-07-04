---
sidebar_position: 3
---

# 客服工单系统

## 业务背景

Atlassian 的客服部门使用自研的 “客服工单队列管理系统” (Support Ticket Queue Management Console) 来安排工作，分配工单。

![](/img/symphony.jpeg) 

在这个系统中，我负责的内容有：
- Ticket Queue page 的 GraphQL 性能优化
-  Team Health page 这一功能的开发，让客服经理可以对组内客服的状态一目了然，提高人效。

![](/img/team-health-page.jpeg)

在开发过程中，我有以下几点学习和收获：

## GraphQL 性能优化

在这个系统中，大量的 API 请求是通过 GraphQL 实现的，这部分具体的技术栈是：

- 前端: Apollo Client
- GraphQL IDE（方便开发时快速测试 GQL 语句和查询 schema）: [GraphiQL](https://team.atlassian.com/gateway/api/graphql)
- 后端: Netflix DGS

GraphQL 中常见的问题之一是 n+1 问题，以工单队列页面的这个 query 为例：
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

不过有个问题：这种缓存默认是在内存中的。这样的话，每次刷新页面，缓存都会丢失。

所以我们还需要使用 `apollo3-cache-persist` 这个插件，将缓存 persist 到localStorage里：

```typescript showLineNumbers
import { InMemoryCache, ApolloClient } from '@apollo/client';

const cache =  new InMemoryCache({
    typePolicies: {
        Agent: {
             keyFields: ["email"],
        }
    }
})
// highlight-start
await persistCache({
  cache,
  storage: new LocalStorageWrapper(window.localStorage),
});
// highlight-end
const client = new ApolloClient({
  cache: cache
});
```

## GraphQL 实时更新

有时我们希望可以让前端实时显示数据变化，例如在 Team Health 页面中，当一个客服人员修改自己的状态，客服经理应当能够实时看到这个变更。我使用了 GraphQL 的 subscription 功能来实现这一点。

首先，在服务端的 Data Fetcher 中 定义 Subscription：

```java showLineNumbers
import com.netflix.graphql.dgs.DgsComponent;
import com.netflix.graphql.dgs.DgsSubscription;
import com.netflix.graphql.dgs.InputArgument;
import org.reactivestreams.Publisher;

@DgsComponent
@AllArgsConstructor
public class AgentDatafetcher {
  private final AgentEventSubscriptionService agentEventSubscriptionServce; 

  @DgsSubscription
  public Publisher<UserUpdate> agentUpdated(@InputArgument List<String> userIds) {
    return agentEventSubscriptionServce.subscribeByAgentIds(new HashSet<>(userIds));
  }
}

```

（这段代码中的 `AgentEventSubscriptionService` 是一个通过 [ReactiveX](https://reactivex.io) 中的 `ObservableOnSubscribe` 来实现的数据流 subscription） 

然后，我们就可以在前端通过 graphql 里使用这个 subscription：

```graphql
subscription OnAgentUpdated($userIds: [String!]!){
  agentUpdated(userIds: $userIds){
    agentStatus {
      name
      status
      ...
    }
  }
}
```


## 内容安全策略 (CSP)

一开始实现完上述的功能后，我发现实时更新并不能正常工作，这是怎么回事呢？

在浏览器 console 中看到以下报错后，我发现了问题所在：

> Refused to connect to '' because it violates the following Content Security Policy directive: "connect-src 'self' ......"

由于 Apollo client 的 subscription 功能是通过 websocket 实现的，因此我们还需要在 CloudFront 的内容安全策略中，允许跨域的 ws 协议连接。于是，我在 connect-src 中添加了后端地址：

```
connect-src: 'self' wss://[后端地址]  ....
```

部署后可以看到，实时更新功能能够正常工作了～

![](/img/wss-console.jpeg)