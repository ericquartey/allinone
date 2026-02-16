# 📚 Documentazione API Backend EjLog

## 🌐 Informazioni Generali

- **Base URL**: `http://localhost:3079/EjLogHostVertimag`
- **Formato**: JSON
- **Autenticazione**: JWT (opzionale, attualmente disabilitata)
- **CORS**: Abilitato per localhost
- **Swagger UI**: `http://localhost:3079/EjLogHostVertimag/swagger-ui.html`

---

## 📦 1. ITEMS API - Gestione Articoli

### GET /Items
Recupera lista articoli dal magazzino.

**Parametri Query:**
- `limit` (required): Numero massimo record (max 5000)
- `offset` (optional): Offset per paginazione (default: 0)
- `itemCode` (optional): Filtro per codice articolo

**Response 200:**
```json
{
  "result": "OK",
  "recordNumber": 10,
  "message": "Export complete",
  "exportedItems": [
    {
      "code": "ART001",
      "description": "Articolo di Test",
      "inStock": true,
      "understock": false,
      "itemTypeBatch": "NESSUNA",
      "itemTypeSerialNumber": "NESSUNA"
    }
  ],
  "errors": []
}
```

**Campi Articolo:**
- `code`: Codice articolo
- `description`: Descrizione
- `inStock`: Se presente a magazzino
- `understock`: Se sotto scorta minima
- `itemTypeBatch`: Gestione lotto (NESSUNA, SEPARATO, ACCORPATO)
- `itemTypeSerialNumber`: Gestione matricola

### POST /Items
Importa/Modifica/Elimina articoli.

**Request Body:**
```json
[
  {
    "item": "ART001",
    "command": 1,
    "description": "Articolo Test",
    "shortDescription": "Art Test",
    "barcode": "1234567890",
    "measurementUnit": "PZ",
    "weight": 1.5,
    "minimumStock": 10.0,
    "height": 10.0,
    "width": 20.0,
    "depth": 30.0,
    "unitPrice": 15.50,
    "itemTypeManagement": 0,
    "itemCategory": "CAT01",
    "fifoRangeDays": 30,
    "auxHostText01": "",
    "auxHostInt01": null,
    "auxHostDate01": null,
    "auxHostBit01": null,
    "auxHostNum01": null
  }
]
```

**Command Values:**
- `1`: Inserisce o modifica
- `2`: Elimina

---

## 📋 2. LISTS API - Gestione Liste (Picking/Refilling)

### GET /Lists
Recupera liste di picking/refilling.

**Parametri Query:**
- `limit` (required): Numero massimo record (max 5000)
- `offset` (optional): Offset paginazione
- `listNumber` (optional): Filtro numero lista
- `listType` (optional): Tipo lista (0=Picking, 1=Refilling, 2=Inventario)
- `listStatus` (optional): Stato lista (1=In attesa, 2=In esecuzione, 3=Terminata)

**Response 200:**
```json
{
  "result": "OK",
  "recordNumber": 5,
  "message": "Export Liste",
  "exportedItems": [
    {
      "listHeader": {
        "listNumber": "L001",
        "listDescription": "Lista Picking",
        "listType": 0,
        "listStatus": 1,
        "cause": "PICK",
        "orderNumber": "ORD123",
        "auxHostText01": "",
        "auxHostInt01": null
      },
      "listRows": [
        {
          "listNumber": "L001",
          "rowNumber": "1",
          "item": "ART001",
          "lineDescription": "Riga 1",
          "requestedQty": 10.0,
          "processedQty": 0.0,
          "lot": "",
          "serialNumber": "",
          "expiryDate": null,
          "barcodePtl": ""
        }
      ]
    }
  ]
}
```

### POST /Lists
Crea/Modifica/Elimina liste.

**Request Body:**
```json
[
  {
    "listHeader": {
      "listNumber": "L001",
      "command": 1,
      "listDescription": "Nuova Lista",
      "listType": 0,
      "listStatus": 1,
      "priority": 50,
      "cause": "PICK",
      "orderNumber": "ORD123",
      "exitPoint": "EXIT01",
      "selectedWarehouses": [1, 2]
    },
    "listRows": [
      {
        "rowNumber": "1",
        "item": "ART001",
        "requestedQty": 10.0,
        "lineDescription": "Riga test",
        "lot": "",
        "serialNumber": "",
        "expiryDate": null,
        "rowSequence": 1
      }
    ]
  }
]
```

**Command Values:**
- `1`: Nuova lista
- `2`: Elimina lista
- `3`: Aggiorna lista
- `4`: Aggiorna righe

---

## 📊 3. STOCK API - Giacenze Magazzino

### GET /Stock
Recupera giacenze magazzino.

**Parametri Query:**
- `limit` (required): Numero massimo record (max 5000)
- `offset` (optional): Offset paginazione
- `warehouseId` (optional): ID magazzino
- `itemCode` (optional): Codice articolo
- `lot` (optional): Lotto
- `serialNumber` (optional): Matricola
- `expiryDate` (optional): Data scadenza (formato: yyyyMMdd)
- `trayId` (optional): ID UDC/cassetto
- `groupByTray` (optional): Raggruppa per cassetto (boolean)

**Response 200:**
```json
{
  "result": "OK",
  "recordNumber": 25,
  "message": "Export complete",
  "exportedItems": [
    {
      "item": "ART001",
      "description": "Articolo Test",
      "lot": "LOT123",
      "serialNumber": "",
      "expiryDate": "20251231",
      "qty": 100.0,
      "warehouseId": 1,
      "LU": 15
    }
  ]
}
```

---

## 🔄 4. MOVEMENTS API - Movimenti Magazzino

### GET /Movements
Recupera movimenti magazzino.

**Parametri Query:**
- `limit` (required): Numero massimo record (max 5000)
- `offset` (optional): Offset paginazione
- `itemCode` (optional): Codice articolo
- `operationType` (optional): Tipo operazione
- `numList` (optional): Numero lista
- `dateFrom` (optional): Data inizio (formato: yyyyMMddHHmmss)
- `dateTo` (optional): Data fine (formato: yyyyMMddHHmmss)

**Response 200:**
```json
{
  "result": "OK",
  "recordNumber": 50,
  "message": "Export complete",
  "exportedItems": [
    {
      "id": 12345,
      "plantId": 1,
      "listNumber": "L001",
      "lineNumber": "1",
      "operationType": 1,
      "item": "ART001",
      "serialNumber": "",
      "expiryDate": "",
      "newQty": 100.0,
      "oldQty": 110.0,
      "deltaQty": -10.0,
      "barcodePtl": "",
      "orderNumber": "ORD123",
      "cause": "PICK",
      "noteCause": "Prelievo standard",
      "userPpc": "admin",
      "userList": "operatore1",
      "warehouseId": 1,
      "idLU": 25
    }
  ]
}
```

---

## 📦 5. ORDERS API - Gestione Commesse

### GET /Orders
Recupera lista commesse.

**Parametri Query:**
- `limit` (required): Numero massimo record (max 10000)
- `offset` (optional): Offset paginazione
- `order` (optional): Codice commessa

**Response 200:**
```json
{
  "result": "OK",
  "recordNumber": 10,
  "message": "Export complete",
  "exportedItems": [
    {
      "order": "ORD001",
      "description": "Commessa Cliente XYZ"
    }
  ]
}
```

### POST /Orders
Importa/Elimina commesse.

**Request Body:**
```json
[
  {
    "order": "ORD001",
    "command": 1,
    "description": "Nuova Commessa"
  }
]
```

**Command Values:**
- `1`: Inserisce o modifica
- `2`: Elimina

---

## 🏷️ 6. BARCODES API - Gestione Barcode

### GET /Barcodes
Recupera barcode articoli.

**Parametri Query:**
- `limit` (required): Numero massimo record (max 10000)
- `offset` (optional): Offset paginazione
- `itemCode` (optional): Codice articolo

**Response 200:**
```json
{
  "result": "OK",
  "recordNumber": 20,
  "message": "Export complete",
  "exportedItems": [
    {
      "item": "ART001",
      "barccodes": ["1234567890", "0987654321", "1122334455"]
    }
  ]
}
```

### POST /Barcodes
Importa/Elimina barcode.

**Request Body:**
```json
[
  {
    "item": "ART001",
    "barcode": "1234567890",
    "command": 1
  }
]
```

**Command Values:**
- `1`: Inserisce barcode
- `2`: Elimina barcode

---

## 👤 7. USER API - Gestione Utenti e Autenticazione

### GET /User
Recupera lista utenti.

**Parametri Query:**
- `username` (optional): Nome utente per filtro

**Response 200:**
```json
[
  {
    "userName": "admin",
    "accessLevel": 5,
    "description": "Amministratore",
    "lockPpcLogin": false
  }
]
```

### POST /User/Login
Autenticazione utente.

**Parametri Query:**
- `username` (required): Nome utente
- `password` (required): Password

**Response 200 (Success):**
```json
{
  "userName": "admin",
  "accessLevel": 5,
  "description": "Amministratore",
  "lockPpcLogin": false
}
```

**Response 403 (Forbidden):**
Credenziali non valide

---

## 👁️ 8. VIEW LIST API - Liste di Visione

### POST /Lists/ViewList
Crea liste di visione per UDC o prodotti.

**Request Body:**
```json
[
  {
    "listNumber": "VL001",
    "listDescription": "Lista Visione Test",
    "listStatus": 1,
    "listViewUdc": [
      {
        "idudc": 123,
        "rowNumber": "1"
      }
    ],
    "listViewProduct": [
      {
        "item": "ART001",
        "lot": "LOT123",
        "serialNumber": "",
        "expiryDate": "20251231",
        "warehouseId": 1,
        "rowNumber": "2"
      }
    ]
  }
]
```

---

## 🧪 9. TEST API - Endpoint di Test

### GET /test
Endpoint di test per verificare connettività.

**Response 501:**
Ritorna status NOT_IMPLEMENTED (per design)

---

## ⚠️ Gestione Errori

Tutte le API possono restituire errori nel seguente formato:

```json
{
  "result": "NOT OK",
  "message": "Descrizione errore",
  "errors": [
    {
      "errorCode": 500,
      "errorMessage": "Messaggio errore dettagliato",
      "description": "Contesto dell'errore",
      "stackTrace": "Stack trace completo"
    }
  ]
}
```

**Codici di Stato HTTP:**
- `200`: Operazione completata con successo
- `400`: Bad Request - Parametri mancanti o non validi
- `403`: Forbidden - Autenticazione fallita
- `404`: Not Found - Risorsa non trovata
- `500`: Internal Server Error - Errore del server
- `501`: Not Implemented - Funzionalità non implementata

---

## 📌 Note Implementative

### Limiti e Paginazione
- Limite massimo per Items/Lists/Stock/Movements: **5000 record**
- Limite massimo per Orders/Barcodes: **10000 record**
- Utilizzare `offset` per paginazione: `offset = page * limit`

### Formati Data
- Date movimento: `yyyyMMddHHmmss` (es: 20251231235959)
- Date scadenza: `yyyyMMdd` (es: 20251231)

### Campi Ausiliari
Tutti gli endpoint supportano campi ausiliari personalizzabili:
- `auxHostText01-05`: Campi testo
- `auxHostInt01-03`: Campi integer
- `auxHostDate01-03`: Campi data
- `auxHostBit01-03`: Campi booleani
- `auxHostNum01-03`: Campi numerici decimali

### Performance
- Timeout consigliato: 30 secondi
- Cache disabilitata
- Transazioni Hibernate con auto-commit

---

## 🔗 Collegamenti Utili

- **Swagger UI**: http://localhost:3079/EjLogHostVertimag/swagger-ui.html
- **Test Playwright**: `tests/api-endpoints.spec.cjs`
- **Config Backend**: `C:\F_WMS\EjLog\Wmsbase2\config\`
- **Database**: SQL Server 2019 - Database PROMAG

---

## 📝 Esempi di Utilizzo con Fetch API

### Recupero Articoli
```javascript
const response = await fetch('http://localhost:3079/EjLogHostVertimag/Items?limit=10&offset=0');
const data = await response.json();
console.log(data.exportedItems);
```

### Creazione Lista
```javascript
const newList = [{
  listHeader: {
    listNumber: 'L001',
    command: 1,
    listType: 0,
    // ... altri campi
  },
  listRows: [/* righe lista */]
}];

const response = await fetch('http://localhost:3079/EjLogHostVertimag/Lists', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newList)
});

const result = await response.json();
```

### Login Utente
```javascript
const response = await fetch(
  'http://localhost:3079/EjLogHostVertimag/User/Login?username=admin&password=admin',
  { method: 'POST' }
);

if (response.status === 200) {
  const user = await response.json();
  console.log('Login OK:', user.userName);
} else {
  console.log('Login fallito');
}
```

---

**Ultima Revisione**: 21 Novembre 2025
**Versione Backend**: EjLog 2.3.12.4
**Autore**: Sistema EjLog - Promag WMS

