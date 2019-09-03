/* @flow */

import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'
import { createCompilerCreator } from './create-compiler'

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
export const createCompiler = createCompilerCreator(function baseCompile (
  template: string,
  options: CompilerOptions
): CompiledResult {

  // 编译器部分在这里创建了AST 抽象语法树
  const ast = parse(template.trim(), options)
  if (options.optimize !== false) {
    optimize(ast, options)
  }

  // 根据AST生成的渲染函数！
  const code = generate(ast, options)
  return {
    ast,
    render: code.render, // 纯字符串
    staticRenderFns: code.staticRenderFns
  }
})
