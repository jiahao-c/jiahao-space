---
sidebar_position: 9
---

:::note

This blog shares a few solutions for problems that I ran into when upgrading a Kotlin service to Spring Boot 3 and Java 17.

:::

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