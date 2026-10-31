/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import App from './App.tsx'


export function renderApp(id: string) {
    const element = document.getElementById(id)
    if (element === null) {
        throw new Error(`Element with id ${id} not found`)
    }
    render(() => <App />, element)
}
