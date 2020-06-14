import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

// Vue 构造函数
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue) // 添加原型 _init 方法  this._init(options)
stateMixin(Vue) // 添加原型 $data $props $set $delete $watch
eventsMixin(Vue) // 添加原型 $on $once $off $emit
lifecycleMixin(Vue) // 添加原型 _update $forceUpdate $destroy
renderMixin(Vue) // 添加原型 $nextTick _render

export default Vue
