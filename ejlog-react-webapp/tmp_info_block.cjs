const fs = require('fs');
const path = 'src/pages/settings/SettingsAdapterPage.tsx';
const text = fs.readFileSync(path, 'utf-8');
const startMarker = '          {/* Info box */}';
const endMarker = '        </div>\n      )}';
const start = text.indexOf(startMarker);
if (start === -1) throw new Error('start marker not found');
const end = text.indexOf(endMarker, start);
if (end === -1) throw new Error('end marker not found');
const newBlock =           {/* Info box */}
          <div className= mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3>
            <h4 className=font-medium text-blue-900 text-sm mb-1>Come collegare il PPC</h4>
            <ul className=text-xs text-blue-800 space-y-1>
              <li>• Imposta il PPC su: <code className=bg-blue-100 px-1 rounded>{preferredMasUrl}</code></li>
              <li>• Health check: <code className=bg-blue-100 px-1 rounded>GET {preferredMasUrl}/health</code></li>
              <li>• API Items: <code className=bg-blue-100 px-1 rounded>GET {preferredMasUrl}/api/items</code></li>
              <li>• API Lists: <code className=bg-blue-100 px-1 rounded>GET {preferredMasUrl}/api/lists</code></li>
              {standaloneStatus.network && (
                <li className=text-green-700 font-medium pt-1>
                  • Interfaccia: {standaloneStatus.network.networkName}
                </li>
              )}
              {externalMasHost && (
                <li className=text-blue-700 font-medium pt-1>
                  • Override manuale: {externalMasHost} ? {preferredMasUrl}
                </li>
              )}
            </ul>
          </div>

        </div>
      )};
const newText = text.slice(0, start) + newBlock + text.slice(end);
fs.writeFileSync(path, newText, 'utf-8');
print('Info block replaced');
