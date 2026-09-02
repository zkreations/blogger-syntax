import type * as vscode from 'vscode';
import { MockTextDocument } from '../unit/__mocks__/vscode.js';

export function createMockDocument(
  content: string | string[],
  uriString: string = 'file:///mock.xml',
  version: number = 1,
  languageId: string = 'xml',
): vscode.TextDocument {
  return new MockTextDocument(content, uriString, version, languageId) as unknown as vscode.TextDocument;
}
