import path from 'path'

import { DocumentOffsets } from './offsets'

export type Uri = string

export interface LightTextDocument {
    uri: Uri
    languageId: string
}

export interface History {
    addItem(newItem: LightTextDocument): void
    lastN(n: number, languageId?: string, ignoreUris?: string[]): LightTextDocument[]
}

export interface TextDocument extends LightTextDocument {
    content: string
    repoName: string | null
    revision: string | null

    visible: JointRange | null
    selection: JointRange | null
}

/** 0-indexed */
export interface Position {
    line: number
    character: number
}

export interface Range {
    start: Position
    end: Position
}

export interface OffsetRange {
    start: number
    end: number
}

/** Stop recomputing the offset all the time! */
export interface JointRange {
    position: Range
    offset: OffsetRange | null
}

interface VsCodeInlineController {
    selection: Range | null
    error(): Promise<void>
}

interface VsCodeFixupController {
    getTaskRecipeData(taskId: string): Promise<
        | {
              instruction: string
              fileName: string
              precedingText: string
              selectedText: string
              followingText: string
          }
        | undefined
    >
}

export interface ViewControllers {
    inline: VsCodeInlineController
    fixups: VsCodeFixupController
}

export class Workspace {
    constructor(public root: Uri) {}

    /** Returns null if URI protocol is not the same */
    public relativeTo(uri: Uri): string | null {
        const workspace = new URL(this.root)
        const document = new URL(uri)

        if (workspace.protocol !== document.protocol) {
            return null
        }

        return path.relative(workspace.pathname, document.pathname)
    }
}

export interface TextEdit {
    range: Range
    newText: string
}

export interface Indentation {
    kind: 'space' | 'tab'
    /** In `kind` units (2 tabs, 4 spaces, etc.) */
    size: number
}

export abstract class Editor {
    controllers?: ViewControllers

    public abstract getActiveWorkspace(): Workspace | null
    /** TODO: What do we do in the event that a document could belong to multiple available workspace? */
    public abstract getWorkspaceOf(uri: Uri): Workspace | null

    public abstract getActiveLightTextDocument(): LightTextDocument | null
    public abstract getOpenLightTextDocuments(): LightTextDocument[]
    public abstract getTextDocument(uri: Uri): Promise<TextDocument | null>

    /** NOTE: This is currently unused but will be used for inline fix */
    public abstract edit(uri: Uri, edits: TextEdit[]): Promise<void>
    public abstract quickPick(labels: string[]): Promise<string | null>
    public abstract warn(message: string): Promise<void>
    public abstract prompt(prompt?: string): Promise<string | null>

    public abstract getIndentation(): Indentation

    // TODO: When Non-Stop Fixup doesn't depend directly on the chat view,
    // move the recipe to client/cody and remove this entrypoint.
    public abstract didReceiveFixupText(id: string, text: string, state: 'streaming' | 'complete'): Promise<void>

    public async getFullTextDocument(light: LightTextDocument): Promise<TextDocument> {
        const document = await this.getTextDocument(light.uri)

        if (!document) {
            throw new Error(`Attempted to get text document that does not exist with URI '${light.uri}'`)
        }

        return document
    }

    public async getDocumentTextTruncated(uri: Uri): Promise<string | null> {
        const document = await this.getTextDocument(uri)

        if (!document) {
            return null
        }

        const offset = new DocumentOffsets(document.content)

        const range: Range = {
            start: {
                line: 0,
                character: 0,
            },
            end: {
                line: Math.min(offset.lines.length, 10_000),
                character: 0,
            },
        }

        return offset.rangeSlice(range)
    }
}

export class NoopEditor extends Editor {
    public getActiveWorkspace(): Workspace | null {
        return null
    }

    public getActiveLightTextDocument(): TextDocument | null {
        return null
    }

    public getOpenLightTextDocuments(): TextDocument[] {
        return []
    }

    public getWorkspaceOf(uri: string): Workspace | null {
        return null
    }

    public getTextDocument(uri: string): Promise<TextDocument | null> {
        return Promise.resolve(null)
    }

    public edit(uri: string, edits: TextEdit[]): Promise<void> {
        return Promise.resolve()
    }

    public quickPick(labels: string[]): Promise<string | null> {
        return Promise.resolve(null)
    }

    public warn(message: string): Promise<void> {
        return Promise.resolve()
    }

    public prompt(prompt?: string): Promise<string | null> {
        return Promise.resolve(null)
    }

    public getIndentation(): Indentation {
        return {
            kind: 'space',
            size: 4,
        }
    }

    public didReceiveFixupText(id: string, text: string, state: 'streaming' | 'complete'): Promise<void> {
        return Promise.resolve()
    }
}
