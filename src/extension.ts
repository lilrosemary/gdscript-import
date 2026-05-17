import * as vscode from "vscode";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
    // Register the Code Action Provider for GDScript files
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            "gdscript",
            new GDScriptImportActionProvider(),
            { providedCodeActionKinds: GDScriptImportActionProvider.providedCodeActionKinds }
        )
    );
}

export class GDScriptImportActionProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    public async provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        _context: vscode.CodeActionContext,
        _token: vscode.CancellationToken
    ): Promise<vscode.CodeAction[]> {
        
        // Get the word at the current cursor position
        const wordRange = document.getWordRangeAtPosition(range.start);
        if (!wordRange) { return []; }
        
        const className = document.getText(wordRange);
        
        // Ensure it"s a PascalCase class name (e.g., ActorPicker)
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(className)) {
            return [];
        }

        // Prevent duplicate imports: check if it's already preloaded
        const documentText = document.getText();
        if (documentText.includes(`const ${className} = preload`)) {
            return [];
        }

        // Convert PascalCase to snake_case (handles acronyms like NPCController -> npc_controller)
        const snakeCaseName = className
            .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
            .replace(/([a-z\d])([A-Z])/g, "$1_$2")
            .toLowerCase();
            
        const fileName = `${snakeCaseName}.gd`;

        // Search for matching files in the workspace
        const uris = await vscode.workspace.findFiles(`**/${fileName}`, null, 5);
        if (uris.length === 0) { return []; }

        const actions: vscode.CodeAction[] = [];

        for (const uri of uris) {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
            if (!workspaceFolder) { continue; }

            // Calculate path relative to the current file
            const relativePath = path.relative(path.dirname(document.fileName), uri.fsPath).replace(/\\/g, "/");

            // Create the Quick Fix action
            const action = new vscode.CodeAction(`Import ${className} (preload)`, vscode.CodeActionKind.QuickFix);
            action.edit = new vscode.WorkspaceEdit();

            // Find the safest line to insert the preload statement (after extends/class_name)
            let insertLine = 0;
            let lastScriptPreload: number | undefined;
            for (let i = 0; i < document.lineCount; i++) {
                const lineText = document.lineAt(i).text.trim();
                if (lineText.startsWith("class ")) {
                    // Child class, we can safely ignore everything after this.
                    break;
                }
                if (lineText.startsWith("extends ") || 
                    lineText.startsWith("class_name ") || 
                    lineText.startsWith("@abstract ") || 
                    lineText.startsWith("@tool")) {
                    insertLine = i + 1;
                }
                if (lineText.match(/const \w+ = preload\(".+\.gd"\)/)) {
                    lastScriptPreload = i;
                }
            }

            // Draft the insertion edit
            const importStatement = `const ${className} = preload("${relativePath}")`;
            if (typeof lastScriptPreload === "number") {
                action.edit.insert(document.uri, new vscode.Position(lastScriptPreload + 1, 0), `${importStatement}\n`);
            } else {
                action.edit.insert(document.uri, new vscode.Position(insertLine, 0), `\n${importStatement}\n`);
            }
            
            // Mark as a preferred quick fix so you can trigger it easily
            action.isPreferred = true;

            actions.push(action);
        }

        return actions;
    }
}

export function deactivate() {}