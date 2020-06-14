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

/**
 * 扩展了 src/platforms/web/runtime/index.js - $mount 
 * 最终执行的是 src/core/instance/lifecycle.js - mountComponent
 * 用于判断是否需要添加 render 函数，在浏览器中默认需要通过 compiler 生成一个渲染函数
 * runtime-only 版本没有 compiler 编译器，需要预先编译，如 webpack
 * 浏览器环境 <script> 应该使用 entry-runtime-with-compiler 版本
 * @param el 需要挂载的根结点 #app
 * @param hydrating Vue SSR 强制使用激活模式
 */
// 缓存 Vue.prototype.$mount
const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el)

  /* istanbul ignore if */
  // 不能挂载 body 和 html 上
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options
  // resolve template/el and convert to render function
  // 把 template 或者 el 转换成 render function
  if (!options.render) { // 如果没有写 render () {} 则找 template/el
    let template = options.template
    if (template) {
      if (typeof template === 'string') {
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
        template = template.innerHTML
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      template = getOuterHTML(el)
    }
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }

      // 调用 src/platforms/web/compiler/index.js - compileToFunctions
      // template 编译成渲染函数 => render, staticRenderFns
      const { render, staticRenderFns } = compileToFunctions(template, {
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      options.render = render
      /* 
        生成的 render
        function anonymous() {
          with(this){return _c('div',{attrs:{"id":"app"}},[_m(0),_v("\n    "+_s(msg)+"\n  ")])}
        } 
      */
      // console.log(render.toString())
      options.staticRenderFns = staticRenderFns
      /* 
        生成的 staticRenderFns 是一个数组，索性代表在 render 中出现的位置
        vnode 节点的 staticRoot 为 true 时（包括其在内的所有子节点全部是静态节点）
        如 
        <div>
          <h1>Vue</h1>
        </div>
        转化成：
        [0: fn ...]
        function anonymous() {
          with(this){return _c('div',[_c('h1',[_v("Vue")])])}
        }
      */  
      // console.log(staticRenderFns)

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  // 生成好 render 后，最终调用 src/core/instance/lifecycle.js - mountComponent
  // 典型的高阶函数使用，受教了
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

Vue.compile = compileToFunctions

export default Vue
