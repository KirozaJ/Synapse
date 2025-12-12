declare module 'textarea-caret' {
    export default function getCaretCoordinates(
        element: HTMLTextAreaElement | HTMLInputElement,
        position: number,
        options?: any
    ): { top: number; left: number; height: number; };
}
