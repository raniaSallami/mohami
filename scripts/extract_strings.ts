import { Project, SyntaxKind, JsxText, StringLiteral } from 'ts-morph';
import * as fs from 'fs';

const project = new Project();
project.addSourceFilesAtPaths(['pages/**/*.tsx', 'components/**/*.tsx']);

let allStrings = new Set<string>();

const hasArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

project.getSourceFiles().forEach(sourceFile => {
    let modified = false;

    // We process StringLiterals (e.g. placeholder="...", title="...")
    const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
    stringLiterals.forEach(lit => {
        const text = lit.getLiteralValue();
        if (hasArabic(text)) {
            allStrings.add(text.trim());
        }
    });

    // We process JsxText (e.g. <div>مرحبا</div>)
    const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
    jsxTexts.forEach(jsxText => {
        const text = jsxText.getLiteralText();
        if (hasArabic(text) && text.trim().length > 0) {
            allStrings.add(text.trim());
        }
    });
});

const arDict: Record<string, string> = {};
allStrings.forEach(s => {
    arDict[s] = s;
});

const dictStr = JSON.stringify(arDict, null, 2);
fs.writeFileSync('locales/ar.json', dictStr);
console.log(`Extracted ${allStrings.size} unique Arabic strings.`);
