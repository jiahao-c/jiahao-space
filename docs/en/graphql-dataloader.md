---
sidebar_position: 4
---

# Optimizing GQL queries using dataloader and apollo cache

![](/img/symphony.png) 

A ticket queue system uses GraphQL for data fetching.
Tech stack:
Frontend: Apollo Client
GraphQL IDE: [GraphiQL](https://team.atlassian.com/gateway/api/graphql)
Backend: Netflix DGS (Domain Graph Service)


First, we want to solve the n+1 problem for agent status fetching, to reduce the load for agent status service. We can do so by implementing a data loader:


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

Then, we want our frontend to be able to cache graphql queries. We can do so by turning using an InMemoryCache.

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