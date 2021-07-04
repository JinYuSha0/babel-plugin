import React, { useCallback } from 'react'
import _ from 'lodash'

function wrapper() {
    _.debounce()
    _.flatten([[1], [2, [3]]])
}

// React.createElement('div')