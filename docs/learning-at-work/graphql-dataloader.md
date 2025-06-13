---
sidebar_position: 4
---

# Optimizing GQL queries using dataloader 

![](/img/symphony.jpeg) 

A ticket queue system uses GraphQL for data fetching.
Tech stack:
Frontend: Apollo Client
GraphQL IDE: [GraphiQL](https://team.atlassian.com/gateway/api/graphql)
Backend: Netflix DGS (Domain Graph Service)

We want to solve the n+1 problem for agent status fetching, to reduce the load for agent status service. We can do so by implementing a data loader:


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