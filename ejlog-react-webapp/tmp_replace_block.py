from pathlib import Path
import re

path = Path('src/pages/settings/SettingsAdapterPage.tsx')
text = path.read_text(encoding='utf-8', newline='')
newline = '\\r\\n' if '\\r\\n' in text else '\\n'
pattern = re.compile(r'          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">.*?          </div>\\s*', re.DOTALL)
new_block = """          <div className=\"mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3\">
            <h4 className=\"font-medium text-blue-900 text-sm mb-1\">?? Come usare da PPC</h4>
            <ul className=\"text-xs text-blue-800 space-y-1\">
              <li>• Configura il PPC per connettersi a: <code className=\"bg-blue-100 px-1 rounded\">{preferredMasUrl}</code></li>
              <li>• Health check: <code className=\"bg-blue-100 px-1 rounded\">GET {preferredMasUrl}/health</code></li>
              <li>• API Items: <code className=\"bg-blue-100 px-1 rounded\">GET {preferredMasUrl}/api/items</code></li>
              <li>• API Lists: <code className=\"bg-blue-100 px-1 rounded\">GET {preferredMasUrl}/api/lists</code></li>
              {standaloneStatus.network && (
                <li className=\"text-green-700 font-medium pt-1\">
                  • IP rilevato automaticamente dalla scheda di rete: {standaloneStatus.network.networkName}
                </li>
              )}
              {externalMasHost && (
                <li className=\"text-blue-700 font-medium pt-1\">
                  • Override manuale: {externalMasHost} ? {preferredMasUrl}
                </li>
              )}
            </ul>
          </div>
"""
new_block = new_block.replace('\n', newline)
new_text, count = pattern.subn(new_block, text, count=1)
if count == 0:
    raise SystemExit('Block not found for replacement')
path.write_text(new_text, encoding='utf-8', newline='')
print('Block replaced')
