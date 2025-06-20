---
sidebar_position: 9
---

# Service Modernization

:::note

This blog shares a few solutions for problems that I ran into when modernizing a backend service:
- Spring Boot 2 --> Spring Boot 3
- Java 11 --> Java 17
- redisX 6 --> redisX 7
- Spring Cloud AWS 2 --> Spring Cloud AWS 3

:::

## Using `SqsListener` from Spring Cloud AWS 3
Previous annotation for listener method:
```
@SqsListener(value="..." deletionPolicy=SqsMessageDeletionPolicy.ON_SUCCESS)
```
New annotation for listener method:
```
@SqsListener(value="...")
```
Reason: `deletionPolicy` is no longer available in the annotation. It's now controlled by [Acknowledgement Mode](https://docs.awspring.io/spring-cloud-aws/docs/3.0.1/reference/html/index.html#acknowledgement-mode) and the default value is ON_SUCCESS, so we don't need to configure it.

## Jacoco not generating report?

If your service use both `maven-surefire-plugin` and `jacoco-maven-plugin` , you are likely run into a problem where jacoco not generating report.

### Root Cause
Jacoco argline will be overridden by surefire argline.

### Solution
```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.1.2</version>
    <configuration>
        <argLine>
            @{surefireArgLine} // ADD THIS!!!
            ...other arglines for surefire
        </argLine>
    </configuration>
</plugin>
```

```xml
<artifactId>jacoco-maven-plugin</artifactId>
  <executions>
      <execution>
          <id>prepare-agent</id>
          <goals><goal>prepare-agent</goal></goals>
          <configuration> // Add this in prepare-agent!!
              <append>true</append>
              <propertyName>surefireArgLine</propertyName> 
          </configuration>
      </execution>
```


## Hibernate complains about migrations?

### Root cause
Hibernate API breaking changes

### Solution
```yaml
spring:
    jpa:
        properties:
          hibernate:
            id:
              db_structure_naming_strategy: legacy
```

## Maven Errors?
Make sure you use at least maven 3.9.x and Kotlin 1.8.x

