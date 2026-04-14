import { Project, SyntaxKind, JsxText, StringLiteral } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths(['pages/**/*.tsx', 'components/**/*.tsx']);

const hasArabic = (text: string) => /[\u0600-\u06FF]/.test(text);
const escapeStr = (s: string) => s.replace(/"/g, '\\"').replace(/\n/g, '\\n');

project.getSourceFiles().forEach(sourceFile => {
    let modified = false;
    let fullText = sourceFile.getFullText();

    const replacements: { start: number, end: number, newText: string }[] = [];

    sourceFile.getDescendantsOfKind(SyntaxKind.JsxText).forEach(jsxText => {
        const text = jsxText.getLiteralText();
        if (hasArabic(text) && text.trim().length > 0) {
            const start = jsxText.getStart();
            const end = jsxText.getEnd();
            const originalSlice = fullText.slice(start, end);
            const trimmed = text.trim();
            // Replace only the trimmed text inside the slide
            const newSlice = originalSlice.replace(trimmed, `{window.__t("${escapeStr(trimmed)}")}`);
            if (newSlice !== originalSlice) {
                replacements.push({ start, end, newText: newSlice });
            }
        }
    });

    sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral).forEach(lit => {
        const text = lit.getLiteralValue();
        if (hasArabic(text) && text.trim().length > 0) {
            const start = lit.getStart();
            const end = lit.getEnd();
            const parent = lit.getParent();
            const isJsxAttr = parent && parent.getKind() === SyntaxKind.JsxAttribute;
            const newText = isJsxAttr ? `{window.__t("${escapeStr(text)}")}` : `window.__t("${escapeStr(text)}")`;
            replacements.push({ start, end, newText });
        }
    });

    replacements.sort((a, b) => b.start - a.start);

    if (replacements.length > 0) {
        replacements.forEach(r => {
            fullText = fullText.slice(0, r.start) + r.newText + fullText.slice(r.end);
        });
        sourceFile.replaceWithText(fullText);
        sourceFile.saveSync();
        console.log(`Translated ${sourceFile.getFilePath()}`);
    }
});
