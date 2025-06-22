# Locale 和 i18n

Jira 的前端项目非常庞大，需要支持的 locale 和语言有很多，难免会有一些 bug。 虽然我不在 Jira 的前端部门，不过也在几次内部 hackathon 中修复了几个 Jira 的前端 bug，体验了 Jira 这种大型项目的的开发-测试-部署流程，提升了公司整体的产品质量。

以下是其中一个例子。bug 本身比较简单，主要想是分享这一过程中学到的，在大型项目中修 bug 的思路和发布流程：

## bug 简述

在 jira 对外公开的 bug 列表里，有[一个早在 2021 年就被报告的 bug](https://jira.atlassian.com/browse/JRACLOUD-77988)，表现为，无论用户在 Atlassian Cloud 账户设置中把语言设置为什么语言。在使用 Jira 过程中，用户在某一个特定 modal 的日期时间选择框里，都会看到以 English (US) 显示的日期 （即月/日/年 XX:YY AM/PM）。

![](/img/locale-bug.png)

但现实中，有些 locale 的日期是 24 小时制，有些 locale 是 年/月/日，有些 locale 是汉字 “上午/下午” 或者日语“朝/昼”。


## 解决过程

首先，既然这个 bug 只在某个特定 modal 中发生，而不是在所有 modal 中都发生，可以排除是组件库本身的问题。

通过 SourceGraph 搜索 （以及一番手动查找和确认），我们可以定位到这个 Modal 所在的文件。可以看到，这个 Modal 明明从 `useLocale()` hook 中获取了 locale，却忘记在 `<DateTimeField>` 里使用 locale 这个 prop：

```jsx

export const LogTimeModalForm = ({...}) => {

    const locale = useLocale();

    return (
        <DateTimeField
            value={dateStarted || null}
            timeZone={timeZone}
            //...有各种 prop，就是没有 locale
        />
    )
}
```

因此修复也很简单，只需要加上 `locale={locale}` 这个prop就好。

:::note

有1说1，这么简单的一个 bug，被好多用户找客服反馈过，slack 里也一堆客服问预计修复时间，结果在 backlog 里摆了3年也没人修，实在不知道为啥。可能 Jira 的产品经理有自己的想法或者其他更高优先级的需求吧...

:::


不过，在大型项目里，即使只改一行代码，也需要走流程。所以，为了修复这个简单的 bug，我实际做的事情有：
1. 在这个组件里添加上缺少的 prop
1. 在这个组件的 storybook 里也添加上这个缺少的 prop
1. 添加上对应的单元测试
1. 在内部 change control 平台中，创建一个 feature gate
1. 在代码中使用这个 feature gate
1. 把本地的 branch push 到 remote，等待 CI 自动 build 
1. 利用 Jira 开发者工具，创建一个测试 jira 环境(`jiahao.jira-dev.com`)，然后用 branch name 来 override 测试环境的前端代码。
1. 用 Loom 录屏，以演示在对自己账号打开这个 feature gate 的情况下，这个 Modal 在修复后的行为符合预期
1. 提 PR ，等待代码 owner 组 review
1. review 通过后，merge PR，等待自动 progressive rollout
1. 在 dev 和 staging 环境里，打开这个feature gate
1. 等所有 dev 和 staging 里的 e2e 测试都通过
1. 填写变更信息表，选择 release strategy, risk category 等等
1. 向这部分代码的 owner 提交发布计划
1. 少量 rollout，检查前端性能监控 dashboard，确保这个变更不影响性能
1. full prod rollout
1. 清理代码中的 feature gate，提+合并 clean up PR
1. 在 change control 平台中 Archive 这个 feature gate

啊...真累。不过看到 bug 被修好，收到客服同事发来的感谢，还是很开心的～