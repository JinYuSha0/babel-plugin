const fs = require('fs')
const path = require('path')
const babel = require('babel-core')
const types = require('babel-types')

const filePath = path.resolve(__dirname, '../codes/arrowFunction.js')
const code = fs.readFileSync(filePath).toString()

const visitor = {
    ArrowFunctionExpression(path) {
        let params = path.node.params
        let blockStatement = path.node.body
        let func = types.functionExpression(null, params, blockStatement, false, false)
        path.replaceWith(func)
    }
}

const result = babel.transform(code, {
    plugins: [
        { visitor }
    ]
})

console.log(result.code)