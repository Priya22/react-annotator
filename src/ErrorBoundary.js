import React, { Component } from 'react'
class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = {
            hasError: false
        }
    }
    static getDerivedStateFromError(error) {
        return {
            hasError: true
        }
    }
    render() {
        if (this.state.hasError) {
            return <h2>An Unfortuante Error has occured. Please refresh!</h2>
        }
        return this.props.children
    }
}
export default ErrorBoundary