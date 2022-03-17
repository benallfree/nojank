nojank is the zero-dependency tool to help detect and replace janky code with cooperative multitasking that works smoothly in a single thread.

nojank warns you if your node or browser thread is blocking for too long without returning control to the event loop.

<!-- TOC -->

- [Installation](#installation)
- [Quickstart](#quickstart)
- [Fixing jank](#fixing-jank)
  - [Use nojank's forEach/map/reduce/sort](#use-nojanks-foreachmapreducesort)
  - [Use config to fine-tune nojank's sensitivity](#use-config-to-fine-tune-nojanks-sensitivity)
  - [Use onJank to listen for jank events](#use-onjank-to-listen-for-jank-events)
  - [Use stop for server-side code](#use-stop-for-server-side-code)
- [Advanced usage: the run command](#advanced-usage-the-run-command)
  - [Use Generators to process big data](#use-generators-to-process-big-data)
  - [Use execution context to optimize your big data jobs](#use-execution-context-to-optimize-your-big-data-jobs)
  - [Use named swimlanes to manage multiple concurrent job queues](#use-named-swimlanes-to-manage-multiple-concurrent-job-queues)
  - [Use the swimlane priority option to create swimlanes in different pools.](#use-the-swimlane-priority-option-to-create-swimlanes-in-different-pools)
- [Antipatterns](#antipatterns)
  - [Antipattern: overuse of run](#antipattern-overuse-of-run)
  - [Antipattern: asynchronous jobs](#antipattern-asynchronous-jobs)
  - [Antipattern: resolving promises inside jobs](#antipattern-resolving-promises-inside-jobs)
  - [Antipattern: Excessive job queuing](#antipattern-excessive-job-queuing)
  - [Antipattern: Promise chaining](#antipattern-promise-chaining)
  - [Antipattern: calling run recursively](#antipattern-calling-run-recursively)
- [Alternatives and other tools](#alternatives-and-other-tools)
- [Ideas already considered](#ideas-already-considered)
  - [Recursive run](#recursive-run)
  - [Balance the time given to swimlanes in the same pool.](#balance-the-time-given-to-swimlanes-in-the-same-pool)

<!-- /TOC -->

# Installation

```
yarn add nojank
```

```
npm i nojank
```

# Quickstart

Start the jank watchdog as early as possible. The jank watchdog reports two metrics:

- Longest jank
- Any jank exceeding a millisecond threshold (default 150).

```js
import { start } from 'nojank'

// Start watching and warning about jank in dev mode
if (process.env.NODE_ENV === 'development') start()
```

Now you'll see `console.warn` messages like:

```
***LONGEST THREAD BLOCK IS NOW 25ms.
***LONGEST THREAD BLOCK IS NOW 37ms.
***LONGEST THREAD BLOCK IS NOW 120ms.
***JANK WARNING 120ms. CHECK YOUR SYNCHRONOUS CODE NOW
***LONGEST THREAD BLOCK IS NOW 272ms.
***JANK WARNING 272ms. CHECK YOUR SYNCHRONOUS CODE NOW
***LONGEST THREAD BLOCK IS NOW 642ms.
***JANK WARNING 642ms. CHECK YOUR SYNCHRONOUS CODE NOW
```

Use nojank's `watchdog` method to wrap code you suspect of causing jank. Give each watchdog a custom identifier and it will be passed to `onJank` if it janks.

This suspicious operation

```js
const results = BIG_ARRAY.map((item) => doSomethingExpensive(item))
```

gets wrapped and becomes

```js
import { watchdog } from 'nojank'

const results = watchdog(() => {
  return BIG_ARRAY.map((item) => doSomethingExpensive(item))
}, `BIG_ARRAY`)
```

That's it! When these warnings make you angry enough, read on to learn how to fix jank.

# Fixing jank

Jank refers to sluggishness, lack of responsiveness, or extended unresponsiveness in a thread that is supposed to remain responsive for realtime events.

In the browser, jank means the user interface would become unresponsive. The user might not even be able to close the browser tab. On the server, jank means the server would not accept incoming web requests or be able to perform other I/O operations such as socket communication, logging, or file I/O.

Jank can cause a poor realtime experience by pausing unexpectedly while a user is waiting for a response in realtime. It is caused by executing long synchronous tasks on a realtime thread. While the synchronous task is running, control cannot return to the JavaScript event loop ([MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop#event_loop) and [nodejs](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)).

nojank encourages you to convert expensive synchronous operations into a series of inexpensive asynchronous operations in order to reduce or eliminate jank altogether.

The essence of jank management boils down to cooperative multitasking. nojank helps you favor deferred execution of expensive synchronous until there is more idle time to accomplish them.

## Use nojank's `forEach/map/reduce/sort`

When you find janky code, it is almost always a long-running synchronous loop. nojank come batteries included to help with that.

Consider replacing synchronous loops (`do/while/map/reduce/for/forEach/sort`) with nojank's cooperative asynchronous alternatives. There is negligible overhead to doing so. These efficient implementations will execute at the same speed as your original code, except they will share the time with other things running in the same thread.

An expensive synchronous `Array.map` like this can cause jank:

```js
const results = MY_HUGE_ARRAY.map(myExpensiveHashingFunc)
```

Instead, use nojank's `map`:

```js
import { map } from 'nojank'

const results = await map(MY_HUGE_ARRAY, myExpensiveHashingFunc)
```

nojank also offers other iterators:

```js
import { reduce, forEach } from 'nojank'

// Iterate, don't keep any results
await forEach(MY_HUGE_ARRAY, myExpensiveHashingFunc)

// Iterate and reduce the results
const results = await reduce(
  MY_HUGE_ARRAY,
  (carry, item) => {
    carry.push(myExpensiveHashingFunc(item))
    return carry
  },
  []
)
```

And a `sort` method:

```js
import { sort } from 'nojank'

sort(MY_HUGE_ARRAY, myExpensiveComparisonFunc)
```

## Use `config` to fine-tune nojank's sensitivity

The level of jank that feels acceptable can vary from application to application. Rather than trying to solve and silence jank warnings that don't matter, sometimes it is easier to adjust nojank's sensitivity.

```js
import { config } from 'nojank'

config({
  sliceMs: 30,
  warnMs: 50,
})
```

nojank stays out of the way by using idle time to execute jobs. If it detects that the thread is busy with other work, nojank will reduce its processing time to compensate.

| Name    | Default | Description                                                                                                                                                                                  |
| ------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sliceMs | 15      | How long nojank is allowed to process the work queue before returning control to the event loop. 15ms is about 60 frames per second.                                                         |
| warnMs  | 20      | If nojank detects jank lasting longer than this value, it will fire a warning. The warning message differentiates between jank inside its processing queue vs jank coming from unknown code. |

## Use `onJank` to listen for jank events

nojank comes with a default `console.warn` jank listener. To use your own custom listener, subscribe using `onJank`. Adding a custom listener will stop the default `console.warn` listener from firing.

Custom listeners are helpful for building your own debugging UI.

The `watchId` key is a key you define or may be `"unknown"` if the jank occurs in an unknown (unwatched) section of code.

```js
import { onJank } from 'nojank'

const unsubscribe = onJank(({ ms, watchId }) => {
  console.warn(
    `Jank happened for ${ms} milliseconds while watching ${watchId}.`
  )
})

unsubscribe() // Stop listening. Default listener will take back over.
```

## Use `stop` for server-side code

It is necessary to call `stop` when using nojank in nodejs or server contexts. nojank's internal timers must be stopped before the process can exit. Otherwise the process won't exit because async code is still running. This is not an issue in browser contexts because everything is cleaned up when the tab is closed, but it can be a big issue for cloud functions and other similar fire-and-forget server tasks.

```js
import { stop } from 'nojank'

stop() // Give nojank a chance to clean up and exit
```

# Advanced usage: the `run` command

nojank provides a `run` primitive to give you full control over the cooperative multitasking environment.

`run` is how jobs are enqueued. nojank's high level `map/reduce/forEach/sort` helpers are built upon the `run` primitive.

`run` accepts a job function and returns a Promise that resolves when that job is completed. Internally, the job is executed cooperatively along with other jobs while taking breaks to prevent jank.

```js
import { run } from 'nojank'

run(() => myExpensiveHashingFunc('foo'))
  .then((result) => {
    console.log(result)
  })
  .catch((e) => {
    console.error(e)
  })
```

Or using async/await:

```js
try {
  const result = await run(() => myExpensiveHashingFunc('foo'))
  console.log(result)
} catch (e) {
  console.error(e)
}
```

Jobs added using `run` are executed FIFO. Before using `run` directly, consider these alternatives:

- Use nojank's higher order looping primitives `map/reduce/forEach/sort`. They are highly optimized and cover most use cases where you need to iterate through items.
- Create a helper of your own, powered by `run`.
- Rather than calling `run` a bunch of times, re-architect long series of synchronous operations into bite-sized chunks by passing a Generator function to `run`. It takes a little thought to organize your code this way, but the benefits are a smooth user experience and I/O experience without creating thousands or even millions of nojank jobs. See below for a detailed explanation.

## Use Generators to process big data

[Generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators#generator_functions) have first-class support in nojank.

Instead of calling `run` for each element in a big data set, pass a Generator to `run`. Generators are [wicked fast](https://glebbahmutov.com/blog/performance-of-v8-generators-vs-promises/) at chopping up big work asynchronously.

```js
const hashes = await run(function* () {
  // The '*' means it's a generator
  const hashes: string[] = []
  for (let i = 0; i < MY_MASSIVE_INPUT_ARRAY.length; i++) {
    const input = MY_MASSIVE_INPUT_ARRAY[i]
    const hash = myExpensiveHashingFunc(input)
    hashes.push(hash)
    yield hash // This is the magic
  }
  return hashes
})
```

The above creates just one nojank job. The job is a Generator function that iterates over `MY_MASSIVE_INPUT_ARRAY`, yielding after each element, before finishing. It is blazing fast, has all the benefits of returning control to nojank so things can breath, and none of the drawbacks of associated with creating an army of promises.

nojank uses this exact approach internally to implement its `map/reduce/forEach/sort` looping primitives.

## Use execution context to optimize your big data jobs

You may recognize that nojank can't possibly be as performant as synchronous code because:

1. nojank's job scheduler and context switching adds overhead
2. pausing/sharing time with other code adds overhead

The more times you `yield` in your function, the more times control is returned to nojank. This _normally_ means your function a good citizen, but at times it may actually be too generous and cause unnecessary context switching. The sweet spot is to use the time allowed as efficiently as possible.

nojank's `run` command tries to help your job run as efficiently as possible by passing execution context with each invocation.

Suppose you want to populate a large array with expensive values. Doing this synchronously could cause jank, but calling `yield` after each iteration might also cause nojank to _thrash_ by unnecessarily switching execution threads more often than is actually useful. **Remember, the objective of nojank is to create an application that is as responsive as it needs to be.** Anything beyond that leads to wasteful context switching.

Enter `run` context!

```js
run(function* () {
  let context = yield
  const myVals = []
  for (i = 0; i < 100000; i++) {
    myVals.push(myVeryExpensiveFunc(i))
    if (context.shouldYield()) {
      context = yield
    }
  }
})
```

Every call to `yield` will return a freshened execution context. This allows you to make optimization decisions with more clarity.

| Name          | Type     | Description                                                                                                                                                                                                               |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shouldYield` | Function | Returns `true` if it is time to stop or `false` if your job has more time to process without violating nojank's concurrency rules.                                                                                        |
| `maxMs`       | integer  | The maximum number of milliseconds your job should run before calling `yield`. Consider using `shouldYield()` unless you have a special reason for needing to track your own execution time.                              |
| `expiry`      | integer  | The Unix timestamp in milliseconds (same format as `Date.now()`) representing the latest date at which you should `yield`. Unless you have a special need to monitor your own timing, it's better to use `shouldYield()`. |

## Use named swimlanes to manage multiple concurrent job queues

Eliminating jank is pretty good, but it can cause another kind of waiting: waiting for nojank's work queue to process a critical item!

```js
// nojank's work queue will be busy for a while chewing on this
map(MY_MASSIVE_ARRAY, myExpensiveHashingFunc)
```

But now an important job gets enqueued:

```js
// This humble but critical job is at the back of the line
// behind a million less important jobs.
run(() => checkMother() && console.warn(`Your mother needs you!`))
```

nojank solves this issue with **named swimlanes**. Each swimlane gets its own slice of the processing time.

To use named swimlanes, you must provide the lane name as the last parameter of `run`, `map`, `reduce`, or `forEach`.

```js
map(MY_MASSIVE_ARRAY, myExpensiveHashingFunc, {
  lane: 'calc-hashes',
})

run(() => checkMother() && console.warn(`Your mother needs you!`), {
  lane: 'critical',
})
```

Now nojank's task scheduler will share time between `calc-hashes`, `critical`, and a magic lane named `__default__` which is used when you don't provide a specific lane name.

Internally, nojank's visits all swimlanes in a round-robin fashion.

## Use the swimlane `priority` option to create swimlanes in different pools.

When nojank starts, it creates a default swimlane named `__default__` with a priority of `10`. You could do it yourself or override it like this:

```js
import { config } from 'nojank'

config({
  lanes: {
    // nojank makes this entry automatically,
    // or you could change the priority here if
    // you wanted to
    __default__: {
      priority: 10,
    },
  },
})
```

nojank will automatically create a swimlane for each name you mention in your code. By default, these share the same pool `priority` as `__default__`.

But you can also create swimlanes in different `priority` pools. nojank's scheduler will execute ALL jobs in higher priority pools before touching jobs in lower priority pools.

To use swimlanes pools, pass a swimlane config object to `config`.

```js
import { config } from 'nojank'

config({
  lanes: {
    __default__: {
      priority: 10,
    },
    'calc-hashes': {
      priority: 5,
    },
    critical: {
      priority: 999,
    },
  },
})
```

The above will create three swimlanes: `__default__` (always exists), `calc-hashes`, and `critical`. nojank will empty work queues from highest to lowest `priority`. In other words, ALL of the `critical` jobs will be completed, then ALL of the `__default__` jobs, then the `calc-hashes` jobs.

Lanes having the same priority will share time in a round-robin fashion as described above.

Specifying a `priority` parameter when enqueuing a job will produce a warning and has no effect. Priorities cannot be defined or changed by running jobs.

# Antipatterns

In creating nojank, we have learned a lot about what _not_ to do. Here are some common antipatterns.

## Antipattern: overuse of `run`

While it is tempting and even initially helpful to just wrap expensive things in `run`, over time this approach becomes an antipattern.

Consider replacing excessive calls to `run` with higher level helpers of your own that use a Generator instead.

## Antipattern: asynchronous jobs

`run` expects jobs to be synchronous. If a job returns a Promise, `run` will throw an Error.

```js
// Antipattern: throws an Error
const members = await run(async ()=>{
  const _members = await fetch('/api/members/')
  return members.map(m=>{first: member.firstName, last:member.lastName, uuid: calcExpensiveUuid(member)})
})
```

```
Error: Jobs cannot return a Promise
```

nojank's purpose in life is to make synchronous jobs asynchronous. Since JavaScript already does a great job of managing asynchronous code via Promises and `async/await`, there is never a reason to wrap `run` around something that is already asynchronous. If nojank awaited asynchronous jobs, processing the job queue would slow down tremendously.

To rewrite the above by hand:

```js
// Better: the asynchronous part has been hoisted out of `run`

const _members = await fetch('/api/members/')
const members = await run(function* () {
  const { shouldYield } = yield
  const res = []
  for (let i = 0; i < members.length; i++) {
    const _member = members[i]
    res.push({
      first: _member.firstName,
      last: _member.lastName,
      uuid: calcExpensiveUuid(_member),
    })
    if (shouldYield()) {
      yield
    }
  }
  return res
})
```

But of course, nojank already provides a superior helper for this type of pattern:

```js
// Best: use nojank's `map` helper instead
import { map } from 'nojank'

const _members = await fetch('/api/members/')
const members = await map(_members, (member) => ({
  first: member.firstName,
  last: member.lastName,
  uuid: calcExpensiveUuid(member),
}))
```

## Antipattern: resolving promises inside jobs

Promises should not be executed inside jobs. However, just because you can't `return` or `await/then` a Promise inside a job doesn't mean they aren't still useful.

Here's an example that makes good use of Promises inside a job. First, the bad implementation:

```js
// Bad: creates wasteful Promise flooding

const fetchExtraInfo = (id)=>fetchExtraInfo(`/api/members/${.id}/extraInfo`).catch((e) => {
        console.error(`Error fetching extra member info for ${.id}`, e)
        return {} // Empty extraInfo
      })

const members = await map(members, (member) => {
  return {
    // Bad: extraInfo is a promise, which is allowed,
    // but this executes for every
    // item - lots of promises are created
    extraInfo: fetchExtraInfo(member.id),
  }
})
```

A better implementation to avoid Promise flooding is to use a singleton Promise pattern. A singleton Promise makes the Promise the first time and then returns it on subsequent accesses.

```js
// Better: just-in-time singleton promise

const createSingletonPromiseAccessor = (asyncFuncCaller) => {
  let _p
  return ()=>_p || _p = asyncFuncCaller()
}

const members = await map(members, (member) => {
  let _p
  return {
    extraInfo: createSingletonPromiseAccessor(() => fetchExtraInfo(member.id)),
  }
})

// Get some extraInfo. When extraInfo() is called the first,
// time, the promise is created.
extraInfo = await members[0].extraInfo()
```

That is better, but it is still possible to create too many API calls by iterating over too many `members[n].extraInfo()` calls too quickly.

The BEST solution uses a utility like [bottleneck](https://www.npmjs.com/package/bottleneck) to further throttle promise flooding:

```js
// BEST: just-in-time throttled singleton promise

import Bottleneck from 'bottleneck'
const limiter = new Bottleneck()

const members = await map(members, (member) => {
  let _p
  return {
    // This version limits how many fetchExtraInfo calls are
    // live at any given time. There is almost now way to
    // overrun the system with a strategy like this.
    extraInfo: createSingletonPromiseAccessor(() =>
      limiter.schedule(() => fetchExtraInfo(member.id))
    ),
  }
})

// Get some extraInfo
extraInfo = await members[0].extraInfo()
```

## Antipattern: Excessive job queuing

Suppose we have an array of 1 million strings and want to calculate hashes for each element. This can be solved easily using a conventional synchronous loop, but it will jank:

```js
const MY_MASSIVE_INPUT_ARRAY = [
  'string1',
  'string2',
  // ...and a million more
]

// This will jank and lock everything up while processing...
const hashes = MY_MASSIVE_INPUT_ARRAY.map(myExpensiveHashingFunc)
```

Your first thought might be to move the code into a WebWorker or separate server-side process, but each of those takes a lot of thought and management.

Your second thought might be some version of `Promise.all`:

```js
const hashes = await Promise.all(
  MY_MASSIVE_INPUT_ARRAY.map((input) =>
    run(() => myExpensiveHashingFunc(input))
  )
)
```

But oops, you just synchronously iterated over 1 million elements (_jank_) creating 1 million individual nojank jobs with 1 million pending promises. If it works at all, it will be pretty slow and take a lot of memory.

nojank provides better `map/reduce/forEach` primitives already, but it's good to be aware of this antipattern when you are rolling your own enqueuing logic. We discuss using Generators below as the correct alternative.

## Antipattern: Promise chaining

Maybe you already recognize that you can avoid the promise flooding antipattern by using `Array.reduce` to create a [promise chain](https://css-tricks.com/why-using-reduce-to-sequentially-resolve-promises-works/). Those are cool, no doubt.

```js
const hashes = await MY_MASSIVE_INPUT_ARRAY.reduce(
  (carry, input) =>
    carry.then((hashes) =>
      run(() => myExpensiveHashingFunc(input)).then((hash) => {
        hashes.push(hash)
        return hashes
      })
    ),
  Promise.resolve([])
)
```

This is way better because it iterates over the elements in a cooperative way and only creates one nojank job at a time.

But it's still not _great_ because it still does the work of calling `run` a million times and promise resolving a million nojank jobs -- just not all at once (which again is better). Enqueuing jobs and resolving promises does create overhead though.

It's good to be aware of this antipattern too because nojank supports Generators which are much more efficient.

## Antipattern: calling `run` recursively

Calling `run` from inside a job is not allowed. Since `run` returns a Promise, it's hard to accidentally call `run` from inside a job because `run` already throws an Error if a job attempts to `await` anything or return a Promise.

If you find yourself wanting to call `run` from inside a job, you probably are looking for a Generator instead.

We leave this note here just to cover the topic.

# Alternatives and other tools

Cooperative multitasking means breaking jobs into smaller pieces and executing them bit by bit until everything is finished.

There are some interesting packages already out there. For example, you can use [cooperative](https://www.npmjs.com/package/cooperative) to move all kinds of iteration into async versions. Internally, it uses `setImmediate` and breaks tasks up for you.

# Ideas already considered

## Recursive `run`

This is an interesting idea but it's unclear how it would be implemented. `run` is meant to break up synchronous tasks, but `run` itself is asynchronous.

`run` currently does not await any promises, and it would cause serious queue delays if it did. For now, or until we have a better understanding of how to implement asynchronous jobs, `run` cannot be called recursively.

To allow recursive calls to `run`, nojank would need to create a stacked job queue where it executes all jobs in the top-most stack before returning execution to previous stacks.

Recursion would also need to work across priority pools. If a higher priority job calls a lower priority job, that lower priority job would need to execute in a new stack and finish. Meanwhile, incoming jobs should not be added to temporary/recursion stacks, but to the main queue - which may be paused for recursion, which means any recursive call has the effect of pausing all current and new jobs. This tradeoff seems unacceptable.

## Balance the time given to swimlanes in the same pool.

The idea here is that if one swimlane is a bad actor or otherwise hogging the execution slice time, the scheduler will know and skip it in future rounds until the other swimlanes in the same pool have received their share of the time.

This proves quite difficult to do in a way that won't create further unintended side-effects. Handling empty swimlanes, swimlanes that receive new tasks, adding/removing swimlanes, and swimlanes with variable-length jobs from various sources becomes impossible to generalize.

**Instead, the recommendation is to further stratify swimlanes by creating more and using different priorities.**

```

```

```

```
