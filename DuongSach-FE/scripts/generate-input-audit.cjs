const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const rows = [];
function scan(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { scan(file); continue; }
    if (!file.endsWith('.tsx')) continue;
    const source = fs.readFileSync(file, 'utf8');
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node) {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const element = node.tagName.getText(ast);
        if (['input', 'textarea', 'select'].includes(element)) {
          const attrs = Object.fromEntries(node.attributes.properties.filter(ts.isJsxAttribute)
            .map(attribute => [attribute.name.getText(ast), attribute.initializer?.getText(ast) || 'true']));
          rows.push([
            file.replaceAll('\\', '/'), ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1,
            element, attrs.type || '', attrs.value || '', attrs.placeholder || '', attrs.required || '',
            attrs.min || '', attrs.max || '', attrs.step || '', attrs.maxLength || '',
            attrs.readOnly || '', attrs.disabled || '',
          ]);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
}

scan('src');
const columns = ['file', 'line', 'element', 'type', 'value', 'placeholder', 'required', 'min', 'max', 'step', 'maxLength', 'readOnly', 'disabled'];
const csv = value => `"${String(value).replaceAll('"', '""').replaceAll('\r', ' ').replaceAll('\n', ' ')}"`;
const destination = path.resolve('../docs/input-audit.csv');
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, [columns, ...rows].map(row => row.map(csv).join(',')).join('\n') + '\n');
console.log(`Audited ${rows.length} form controls -> ${destination}`);
