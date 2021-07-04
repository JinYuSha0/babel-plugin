const fs = require('fs')
const path = require('path')
const babel = require('babel-core')
const types = require('babel-types')

const filePath = path.resolve(__dirname, '../codes/removeNoInvoke.js')
const code = fs.readFileSync(filePath).toString()

const visitor = {

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