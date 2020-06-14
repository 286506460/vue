/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { isPlainObject, validateComponentName } from '../util/index'

export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   */
  /**
   * Vue.component
   * Vue.directive
   * Vue.filter
   */
  ASSET_TYPES.forEach(type => {
    /**
     * Vue.compontent 组册组件
     */
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      if (!definition) {
        // 如果已经注册则返回
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production' && type === 'component') {
          validateComponentName(id)
        }
        if (type === 'component' && isPlainObject(definition)) {
          definition.name = definition.name || id
          // 核心 返回组件的 VueComponent 类
          definition = this.options._base.extend(definition)
        }
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition }
        }
        // 将该组件放在 options.components 中注册 默认有 {K eepAlive, Transition, TransitionGroup }
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}
