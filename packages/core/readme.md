nojank is the zero-dependency tool to help detect and replace janky code with cooperative multitasking that works smoothly in a single thread.

nojank warns you if your node or browser thread is blocking for too long without returning control to the event loop.

> Jank refers to sluggishness in a user interface, usually caused by executing long tasks on the main thread, blocking rendering, or expending too much processor power on background processes.

<!-- TOC -->

- [Installation](#installation)
- [Quickstart](#quickstart)
- [Fixing jank](#fixing-jank)
  - [Use nojank's forEach/map/reduce](#use-nojanks-foreachmapreduce)
  - [Use push to work directly with the nojank job queue](#use-push-to-work-directly-with-the-nojank-job-queue)
  - [Use config to fine-tune nojank's sensitivity](#use-config-to-fine-tune-nojanks-sensitivity)
  - [Use onJank to listen for jank events](#use-onjank-to-listen-for-jank-events)
  - [Use stop for server-side code](#use-stop-for-server-side-code)
- [Advanced usage, antipatterns, and examples](#advanced-usage-antipatterns-and-examples)
  - [Antipattern: Promise flooding with push](#antipattern-promise-flooding-with-push)
  - [Antipattern: Promise chaining with push](#antipattern-promise-chaining-with-push)
  - [Use Generators with push to process big data](#use-generators-with-push-to-process-big-data)
  - [Use named swimlanes to manage multiple concurrent task queues](#use-named-swimlanes-to-manage-multiple-concurrent-task-queues)
  - [Use the swimlane priority option to create swimlanes in different pools.](#use-the-swimlane-priority-option-to-create-swimlanes-in-different-pools)
- [Alternatives and other tools](#alternatives-and-other-tools)

<!-- /TOC -->

# Installation

```
yarn add nojank
```

```
npm i nojank
```

# Quickstart

Start the jank watchdog as early as possible.

```js
import { start } from 'nojank'

// Start watching and warning about jank in dev mode
if (process.env.NODE_ENV === 'development') start()
```

Now you'll see `console.warn` messages like:

```
***WARNING JANK 642ms DETECTED, CHECK YOUR SYNCHRONOUS CODE NOW
```

Use nojank's `watchdog` method to wrap code you suspect of causing jank. Give each watchdog a custom identifier and it will be passed to `onJank` if it janks.

This suspicious operation

```js
const results = BIG_ARRAY.map((item) => doSomethingExpensive(item))
```

gets wrapped and becomes

```js
import { watchdog, onJank } from 'nojank'

const results = watchdog(() => {
  return BIG_ARRAY.map((item) => doSomethingExpensive(item))
}, `BIG_ARRAY`)

onJank(({ ms, watchId }) => {
  console.warn(`Got a watchdog event for ${watchId}`)
})
```

That's it! When these warnings make you angry enough, read on to learn how to fix jank.

# Fixing jank

## Use nojank's `forEach/map/reduce`

When you find janky code, it is almost always a long-running synchronous loop. nojank come batteries included to help with that.

Consider replacing synchronous loops (`do/while/map/reduce/for/forEach`) with nojank's asynchronous alternatives. There is no overhead or performance penalty. These efficient implementations will execute at the same speed as your original code, except they will share the time with other things running in the same thread.

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

## Use `push` to work directly with the nojank job queue

nojank helps you break tasks into smaller jobs in order to reduce or eliminate jank altogether. The essence of jank management boils down to cooperative multitasking where you define a callback that knows how to nibble on a bit of work and finish quickly.

nojank offers a lightweight and efficient task queue to help avoid jank. Long series of synchronous operations can be broken into bite-sized chunks that do a small piece of work and exit quickly. It takes a little thought to organize your code this way, but the benefits are a smooth user experience and I/O experience.

nojank's `push` method accepts a task function and returns a Promise that resolves when that task is completed. Internally, the task is executed cooperatively along with other tasks while taking breaks to prevent jank.

```js
import { push } from 'nojank'

push(() => myExpensiveHashingFunc('foo'))
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
  const result = await push(() => myExpensiveHashingFunc('foo'))
  console.log(result)
} catch (e) {
  console.error(e)
}
```

Normally the higher order looping primitives `map/reduce/forEach` will be sufficient. But for times when they are not, `push` is available too. Jobs added using `push` are executed FIFO.

## Use `config` to fine-tune nojank's sensitivity

The level of jank that feels acceptable can vary from application to application. Rather than trying to solve and silence jank warnings that don't matter, sometimes it is easier to adjust nojank's sensitivity.

```js
import { config } from 'nojank'

config({
  sliceMs: 30,
  warnMs: 50,
})
```

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

# Advanced usage, antipatterns, and examples

## Antipattern: Promise flooding with `push`

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

In the browser, jank means the user interface would be unresponsive until the loop finished. The user might not even be able to close the browser tab. On the server, jank means the server would not accept incoming web requests or be able to perform other I/O operations such as socket communication, logging, or file I/O.

Your first thought might be to move the code into a WebWorker or separate server-side process, but each of those takes a lot of thought and management.

Your second thought might be some version of `Promise.all`:

```js
const hashes = await Promise.all(
  MY_MASSIVE_INPUT_ARRAY.map((input) =>
    push(() => myExpensiveHashingFunc(input))
  )
)
```

But oops, you just synchronously iterated over 1 million elements (_jank_) creating 1 million individual nojank jobs with 1 million pending promises. If it works at all, it will be pretty slow and take a lot of memory.

nojank provides better `map/reduce/forEach` primitives already, but it's good to be aware of this antipattern when you are rolling your own enqueuing logic. We discuss using Generators below as the correct alternative.

## Antipattern: Promise chaining with `push`

Maybe you already recognize that you can avoid the promise flooding antipattern by using `Array.reduce` to create a [promise chain](https://css-tricks.com/why-using-reduce-to-sequentially-resolve-promises-works/). Those are cool, no doubt.

```js
const hashes = await MY_MASSIVE_INPUT_ARRAY.reduce(
  (carry, input) =>
    carry.then((hashes) =>
      push(() => myExpensiveHashingFunc(input)).then((hash) => {
        hashes.push(hash)
        return hashes
      })
    ),
  Promise.resolve([])
)
```

This is way better because it iterates over the elements in a cooperative way and only creates one nojank job at a time.

But it's still not _great_ because it still does the work of calling `push` a million times and promise resolving a million nojank jobs -- just not all at once (which again is better). Enqueuing jobs and resolving promises does create overhead though.

It's good to be aware of this antipattern too because nojank supports Generators which are much more efficient.

## Use Generators with `push` to process big data

[Generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators#generator_functions) have first-class support in nojank.

Instead of calling `push` for each element in a big data set, nojank's `push` command can accept a Generator function. Generators are [wicked fast](https://glebbahmutov.com/blog/performance-of-v8-generators-vs-promises/) at chopping up big work.

```js
const hashes = await push(function* () {
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

The above creates just one nojank task. The task is a Generator function that iterates over `MY_MASSIVE_INPUT_ARRAY`, yielding after each element, before finishing. It is blazing fast, has all the benefits of returning control to nojank so things can breath, and none of the drawbacks of associated with creating an army of promises.

nojank uses this exact approach internally to implement its `map/reduce/forEach` looping primitives.

This approach is The Way.

## Use named swimlanes to manage multiple concurrent task queues

Eliminating jank is pretty good, but it can cause another kind of waiting: waiting for nojank's work queue to process a critical item!

```js
// nojank's work queue will be busy for a while chewing on this
map(MY_MASSIVE_ARRAY, myExpensiveHashingFunc)
```

But now an important job gets enqueued:

```js
// This humble but critical job is at the back of the line
// behind a million less important jobs.
push(() => checkMother() && console.warn(`Your mother needs you!`))
```

nojank solves this issue with **named swimlanes**. Each swimlane gets its own slice of the processing time.

To use named swimlanes, you must provide the lane name as the last parameter of `push`, `map`, `reduce`, or `forEach`.

```js
map(MY_MASSIVE_ARRAY, myExpensiveHashingFunc, {
  lane: 'calc-hashes',
})

push(() => checkMother() && console.warn(`Your mother needs you!`), {
  lane: 'critical',
})
```

Now nojank's task scheduler will share time between `calc-hashes`, `critical`, and a magic lane named `__default__` which is used when you don't provide a specific lane name.

Internally, nojank's scheduler makes sure all swimlanes get the same time allotment in a round-robin fashion. If a job in one swimlane takes 20ms, it will not be scheduled again until all other swimlanes have received their 20ms of time or are empty. This way, you can add as many jobs to a swimlane, whether expensive or inexpensive, and it will not unfairly hold up jobs in other swimlanes.

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

Lanes having the same priority will share time as described above.

Specifying a `priority` parameter when enqueuing a job will produce a warning and has no effect. Priorities cannot be defined or changed by pushing jobs.

# Alternatives and other tools

Cooperative multitasking means breaking jobs into smaller pieces and executing them bit by bit until everything is finished.

There are some interesting packages already out there. For example, you can use [cooperative](https://www.npmjs.com/package/cooperative) to move all kinds of iteration into async versions. Internally, it uses `setImmediate` and breaks tasks up for you.
