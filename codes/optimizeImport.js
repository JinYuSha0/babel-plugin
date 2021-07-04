import _ from 'lodash'
import React, { useCallback } from 'react'
import { View, Image } from 'react-native-ui-lib'

function wrapper() {
    _.debounce()
    _.flatten([[1], [2, [3]]])
}

// React.createElement(View)