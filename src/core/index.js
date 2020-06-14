import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index'
import { isServerRendering } from 'core/util/env'
import { FunctionalRenderContext } from 'core/vdom/create-functional-component'

/* 
添加全局类属性 API 方法，包括：
  1. Vue.config
  2. Vue.set
  3. Vue.delete
  4. Vue.nextTick
  5. Vue.util
  6. Vue.observable
  7. Vue.options
  8. Vue.mixin
  9. Vue.use
  10. Vue.extend
  11. 内置组件 KeepAlive
*/
initGlobalAPI(Vue)

Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})

Object.defineProperty(Vue.prototype, '$ssrContext', {
  get () {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
})

// expose FunctionalRenderContext for ssr runtime helper installation
Object.defineProperty(Vue, 'FunctionalRenderContext', {
  value: FunctionalRenderContext
})

Vue.version = '__VERSION__'

// 返回了最终的 Vue 构造函数
export default Vue
