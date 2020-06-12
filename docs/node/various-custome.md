---
title: 其他各种实现
date: 2020-06-10 19:48:37
tags: [node]
---

## 1. apply 实现

本质还是利用了, function 内 this 指向调用方

``` js
Function.prototype.my_apply = function (ctx = {}, args = []) {
  ctx.fn = this

  const result = ctx.fn(...args)
  // 本质还是利用了, function 内 this 指向调用方
  delete ctx.fn
  return result
}
```

## 2. call 实现

可以看到和 apply 的区别: 参数不同

``` js
Function.prototype.my_call = function (ctx = {}, ...args) {
  ctx.fn = this

  const result = context.fn(...args)
  delete context.fn
  return result
}
```

## 3. bind 实现

bind 和 apply、call 的区别是:
- bind 返回的是个函数
- bind 可以传参
- bind 返回的函数亦可以传参

``` js
Function.prototype.my_bind = function (ctx = {}, ...args) {
  const self = this
  return function (...args1) {
    // 此处直接使用 apply, 也可以再手写一个
    // 此处手写的话, 就不用在意 this 指向了
    // 此处的 this 会执行其调用方, 所以使用外部 self 调用 my_applay
    const result = self.my_apply(ctx, [].concat(args, args1))
    return result
  }
}
```
## 4. new 实现

new 本质是三个步骤
- 1. 创建新的 object
- 2. 调用构造, 改变其 this 指向为此新 object
- 3. 原型链处理

``` js
function myNew (fun) {
  const obj = {}
  fun.call(obj)
  obj.__proto__ = fun.prototype
  return obj
}
```

## 5. Object create 实现

返回值本质是个新对象 `{}`, 输入数据作为该新对象的 `__proto__` 属性 <br>

create 的第二个参数, 实际上就是用来定义这个新 `{}` 属性的, 此处没有实现

``` js
Object.create = function (proto) {
  const fn = function () {}
  fn.prototype = proto

  return myNew(fn)

  // const obj = {}
  // obj.__proto__  = proto
  // return obj
}
```

原型链继承时, 为了防止子类重写时修改父类方法, 一般使用 Object.create 等来操作，比如:
``` js
A.prototype = Object.create(B.prototype) // 多了新的 {} 这一层
// 而不是
A.prototype = B.prototype // 子类重写时会修改父类方法
```

## 6. 深层拷贝

> 循环实现, 比较麻烦, 也看了下别人的实现

但是等我自己写了该实现, 准备把别人的实现作为参考链接时, 找不到了, 找到的朋友留个言 😂

``` js

function deepCopy_cyclic (obj) {
  const target = {}
  const res = [
    {
      parent: target,
      data: obj
    }
  ]

  while (res.length) {
    const node = res.pop()
    const [parent, data] = [node.parent, node.data]
    for (const i in node.data) {
      if (typeof data[i] === 'object') {
        parent[i] = {}
        res.push({
          parent: parent[i],
          // 关键点在这里, parent<key> 成为了 target 下某个值为 object 的引用
          // 下个循环对 parent object 做修改, 也就是对 target 做修改
          data: data[i]
        })
      } else {
        parent[i] = data[i]
      }
    }
  }
  return target
}

```

> 递归实现比较简单

``` js
function deepCopy_recursive (obj) {
  const target = {}
  for (const i in obj) {
    if (typeof obj[i] === 'object') {
      target[i] = deepCopy_recursive(obj[i])
    } else {
      target[i] = obj[i]
    }
  }
  return target
}
```

## 7. compose 实现

可以看到实际上就是使用 `async await` 处理了 `promise` 的递归处理 <br>
和 express、fastify 等框架的在中间件上的区别就在于此 <br>

``` js
const compose = async function (middleWares) {
  const run = async function (middleWares) {
    if (!middleWares.length) return
    const fn = middleWares[0]
    const next = async function () {
      await run(middleWares.splice(1)) // 剔除头部
    }
    await fn(context, next)
  }
  await run(middleWares)
}
```
## 8. async await 的简单实现

理论上 async await 比 co 多了点东西, 但是没有仔细研究, 模仿 co 简单实现了一下 😄; <br>
而且砍掉了一部分, 支持了 promise 😸; <br>

::: warning
但是学到了很关键的一点: <br>
原来 `Generator.prototype.throw()` 的处理, 才是 await 后的抛错, 可以被 `try catch` 捕捉的原因
:::

关于这个 throw 无论有没有理解错, 但始终没搞明白到底怎么回事, 应该需要研究一下 generator 才能搞明白

``` js
function * test (num) {
  console.log('start')
  const a = yield 1
  // const a = yield (() => { throw new Error('next error') })()
  console.log('a =====> ', num, a)
  const b = yield delay(undefined, 100000, num)
  console.log('b =====> ', num, b)
  console.log('end')
  return num + 10
}

function delay (time = 2000, result, num) {
  console.log(`start delay ${time} ======= `, num, new Date())
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(`end delay ${time} ======= `, num, new Date())
      resolve(result)
      // reject(new Error('vlaue error'))
    }, time)
  })
}

function myAsync (fun) {
  return function (...args) {
    // 返回 function 对函数包装之后肯定还是函数, 对吧
    const self = this
    return new Promise((resolve, reject) => {
      // 返回 promise, async 返回 promise
      const gen = fun.apply(self, args)
      if (!gen || typeof gen.next !== 'function') return resolve(gen)

      next()

      function onReject (e) {
        try {
          gen.throw(e)
          // 参考 co 才发现, 需要关闭生成器, 不然即便报错了, 仍然可以重用
          // 另外, 这个才是 await 可以被 try catch 捕捉的关键啊, 用来向外部的生成器抛错
          // 没搞太懂, 这个是怎么抛错的, 看来是收获研究一波 generator 了
        } catch (error) {
          reject(e)
        }
      }

      function next (value) {
        let res
        try {
          res = gen.next(value)
        } catch (e) {
          return onReject(e) // 捕捉 next 报错
        }
        return Promise.resolve(res.value) // 兼容 res.value 是 promise 的情况
          .then(
            v => {
              if (res.done) return resolve(v)
              return next(v) // .then 包装, 和上面的 Promise.resolve 一样, 保证了 promise 状态变更 (就是执行完了)
            },
            onReject // 捕捉 value <Promise> 报错
          )
      }
    })
  }
}

myAsync(function * () {
  try {
    // 此处的 yield 关键字 配合上面的 gen.throw, 可以使 try catch 捕捉到报错
    // 但是如果使用 myAsync(test)(10).catch(e => {}) 捕捉的话, 那就是生成器关闭了, 什么都没了
    const result = yield myAsync(test)(10)
    console.log('result ===> ', result)
  } catch (e) {
    console.log('external error ===> ', e)
  }
})()
```
