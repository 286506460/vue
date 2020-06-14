/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    // 每个组件实例的递增 id
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    // 不观测 this 目前我发现的 observe 只观测 props 和 data
    vm._isVue = true
    // merge options
    // 合并传进来的选项
    if (options && options._isComponent) {
      // 如果是组件场景 Vue.component => Vue.extend()
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      // 如果是组件，因为动态合并选项很慢，所以优化合并，而且所有的组件内部选项不需要特殊处理
      initInternalComponent(vm, options)
    } else {
      // 如果是外部调用场景，new Vue()
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    initLifecycle(vm) // $parent $root $children $refs
    /**
     * 父组件给子组件的注册事件中，把自定义事件传给子组件，在子组件实例化的时候进行初始化；
     * 而浏览器原生事件是在父组件中处理。
     */
    initEvents(vm) // _events
    initRender(vm) // _vnode $slots $scopedSlots $createElement
    callHook(vm, 'beforeCreate') // 执行生命周期 beforeCreate
    initInjections(vm) // resolve injections before data/props
    initState(vm) // // props methods data computed watch
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created') // 执行生命周期 created 

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el) // 挂载节点
    }
  }
}

export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  // vm.constructor 是一个通过 extend 产生的 VueComponent 类
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode // 当前组件 vnode created by createComponentInstanceForVnode
  opts.parent = options.parent // 父组件实例
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData // 当前组件 props
  opts._parentListeners = vnodeComponentOptions.listeners // 当前组件 listener
  opts._renderChildren = vnodeComponentOptions.children // 当前组件 children
  opts._componentTag = vnodeComponentOptions.tag // 当前组件 tag

  // 是否定义了组件的 render
  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
