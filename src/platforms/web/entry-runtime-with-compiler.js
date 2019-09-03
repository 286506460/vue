/* @flow */

import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

import Vue from './runtime/index'
import { query } from './util/index'
import { compileToFunctions } from './compiler/index'
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from './util/compat'

const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})

// runtime compiler 是不带编译功能，无法编译模版，所以需要重新定义$mount
const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el)

  /* istanbul ignore if */
  // el不能选择为html和body标签，提供的元素只能作为挂载点。不同于 Vue 1.x，所有的挂载元素会被 Vue 生成的 DOM 替换。
  // 因此不推荐挂载 root 实例到 <html> 或者 <body> 上。
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options
  // resolve template/el and convert to render function
  // 如果没有声明render函数，则转换模版为render函数
  if (!options.render) {
    let template = options.template
    // 如果声明了template（优先级比el高）则提取dom
    if (template) {
      if (typeof template === 'string') {
        // 如果模版是#开始，则它将被用作选择符，返回document.querySelector
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {
        // 模版是一个HTMLElement实例
        template = template.innerHTML
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      // 没有声明template 声明了el
      template = getOuterHTML(el)
    }
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }

      // 执行这里之前 src/platforms/web/compiler/index.js 先调用createCompiler(baseOptions)创建编译器函数
      // createCompiler 调用 src/compiler/index.js createCompilerCreator
      // createCompilerCreator 调用 src/compiler/create-compiler.js
      //   return {
      //     compile,
      //     compileToFunctions: createCompileToFunctionFn(compile) => src/compiler/to-function.js
      //   }
      //
      // compileToFunctions 就是 src/compiler/to-function.js 的compileToFunctions返回结果

      const { render, staticRenderFns } = compileToFunctions(template, {
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)

      // 留个疑问options.render到底何时调用的 ？

      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }

  // 如果在实例化时存在el选项，实例将立即进入编译过程，否则，需要显式调用 vm.$mount() 手动开启编译。
  /*
    new Vue({ el: '#app' })
    new Vue({ ... }).$mount('#app')
  */
  return mount.call(this, el, hydrating)
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML (el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

// https://cn.vuejs.org/v2/api/#Vue-compile 在 render 函数中编译模板字符串
Vue.compile = compileToFunctions

export default Vue
