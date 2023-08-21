import React, { RefObject } from 'react'

import { createPortal } from 'react-dom'

import { ChatEditor } from '../components/ChatEditor'
import { CodyChatStore } from '../useCodyChat'

import { CodyRecipesWidget } from './CodyRecipesWidget'
import { useTextSelection } from './useTextSelection'

interface RecipesWidgetWrapperProps {
    targetRef: RefObject<HTMLElement>
    children: React.ReactNode
    codyChatStore: CodyChatStore
    fileName?: string
    repoName?: string
    revision?: string
}

export const CodyRecipesWidgetWrapper: React.FunctionComponent<RecipesWidgetWrapperProps> = React.memo(
    function CodyRecipesWidgetWrapper({ targetRef, children, codyChatStore }) {
        return (
            <>
                {children}
                {targetRef.current && <RecipePopoverManager targetRef={targetRef} codyChatStore={codyChatStore} />}
            </>
        )
    }
)

const RecipePopoverManager: React.FunctionComponent<{
    targetRef: RefObject<HTMLElement>
    codyChatStore: CodyChatStore
}> = React.memo(function ReacipePopoverMangerComponent({ targetRef, codyChatStore }) {
    const { isCollapsed, textContent } = useTextSelection(targetRef?.current || undefined)

    if (isCollapsed || !textContent) {
        return null
    }

    return (
        <RecipePopoverPortal
            key={textContent}
            targetRef={targetRef}
            codyChatStore={codyChatStore}
            selectedText={textContent || ''}
        />
    )
})

function getElementFromNode(node: any): HTMLElement {
    const currentElement =
        node.previousElementSibling?.nextElementSibling || node.nextElementSibling?.previousElementSibling

    if (currentElement) {
        return currentElement
    }

    const lastElementChild = node.parentElement?.lastElementChild
    if (lastElementChild) {
        if (lastElementChild.className.includes('cody-recipe-widget')) {
            return lastElementChild.previousElementSibling || node.parentElement
        }

        return lastElementChild
    }
    return node.parentElement
}

const RecipePopoverPortal: React.FunctionComponent<{
    targetRef: RefObject<HTMLElement>
    codyChatStore: CodyChatStore
    selectedText: string
}> = function ReacipePopoverPortalComponent({ targetRef, codyChatStore, selectedText }) {
    const selection = window.getSelection()

    const commonAncestorContainer = selection?.getRangeAt(0)?.commonAncestorContainer as any
    if (!commonAncestorContainer) {
        return null
    }

    const positioningElement = getElementFromNode(selection?.focusNode)
    if (!positioningElement) {
        return null
    }

    const positioningClientRect = positioningElement.getBoundingClientRect()

    const mountContainer = commonAncestorContainer.lastElementChild || commonAncestorContainer
    const mountContainerRect = mountContainer.getBoundingClientRect()

    return createPortal(
        <CodyRecipesWidget
            className="cody-recipe-widget"
            style={{
                position: 'absolute',
                marginTop: `-${mountContainerRect.top - positioningClientRect.top + positioningClientRect.height}px`,
            }}
            codyChatStore={codyChatStore}
            editor={
                new ChatEditor({
                    content: targetRef?.current?.innerText || '',
                    selectedText,
                    filename: '',
                    repo: '',
                    revision: '',
                })
            }
        />,
        commonAncestorContainer.lastChild?.previousSibling || commonAncestorContainer
    )
}
