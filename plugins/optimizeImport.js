const fs = require('fs')
const path = require('path')
const babel = require('babel-core')
const types = require('babel-types')

const filePath = path.resolve(__dirname, '../codes/optimizeImport.js')
const code = fs.readFileSync(filePath).toString()

function genBuildImportDeclaration(t, name, source) {
    return t.importDeclaration(
            [t.importDefaultSpecifier(t.identifier(name))],
            t.stringLiteral(`${source}/${String(name).toLowerCase()}`
        )
    )
}

const visitor = {
    ImportDeclaration(path) {
        const specifiers = path.node.specifiers;
        const source = path.node.source;

        // import Xxx from 'xxx'
        if (specifiers && specifiers.length === 1
            // import _ from 'lodash' || import * as _ from 'lodash
            && (types.isImportDefaultSpecifier(specifiers[0]) || types.isImportNamespaceSpecifier(specifiers[0]))
            && types.isStringLiteral(source)
            && this.processModule.has(source.value)
        ) {
            this.moduleNames.set(specifiers[0].local.name, source.value)
            this.noNeedModule.add(specifiers[0].local.name)
            path.remove()
            return
        }

        // import { ... } from 'xxx'
        if (types.isImportDeclaration(path.node)
            && specifiers && specifiers.length > 0
            && this.processModule.has(source.value)
        ) {
            if (!this.propertyNames.has(source.value)) {
                this.propertyNames.set(source.value, new Set())
            }
            const set = this.propertyNames.get(source.value)
            specifiers.forEach((specifier) => {
                set.add(specifier.local.name)
                this.noNeedModule.add(specifier.local.name)
            })
            path.remove()
        }
    },
    CallExpression(path) {
        if (path.node.callee && path.node.callee.object
            && this.moduleNames.has(path.node.callee.object.name)
        ) {
            const calleeName = path.node.callee.object.name
            const propertyName = path.get('callee.property').node.name
            this.noNeedModule.delete(calleeName)
            if (!this.propertyNames.has(calleeName)) {
                this.propertyNames.set(calleeName, new Set())
            }
            this.propertyNames.get(calleeName).add(propertyName)
            path.get('callee').replaceWith(types.identifier(propertyName))
        }
    },
    Identifier(path) {
        this.noNeedModule.delete(path.node.name)
    }
}

const result = babel.transform(code, {
    plugins: [
        {
            pre: function (state) {
                // 需要处理的库
                this.processModule = new Set(['lodash', 'react-native-ui-lib', 'react'])
                // 库名或者导入id与其属性的映射关洗
                this.propertyNames = new Map()
                // 导入id与库名的映射关洗
                this.moduleNames = new Map()
                // 没有用到过的模块
                this.noNeedModule = new Set()
            },
            visitor,
            post(state) {
                for (let kv of this.propertyNames) {
                    const [key, value] = kv
                    Array.from(value).forEach((propertyName) => {
                        if (!this.noNeedModule.has(propertyName) && !this.noNeedModule.has(key)) {
                            state.path.node.body.unshift(
                                genBuildImportDeclaration(types, propertyName, this.moduleNames.get(key) || key)
                            )
                        }
                    })
                }
            }
        }
    ]
})

console.log(result.code)