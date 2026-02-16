/**
 * EjLog Adapter Repository
 * Gestione database JSON per l'adapter integrato
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'database.json');

class AdapterRepository {
  constructor() {
    this.loadDatabase();
  }

  // ============================================
  // DATABASE OPERATIONS
  // ============================================

  loadDatabase() {
    try {
      if (existsSync(DB_PATH)) {
        const data = readFileSync(DB_PATH, 'utf8');
        this.db = JSON.parse(data);
        console.log('[ADAPTER REPO] Database caricato con successo');
      } else {
        this.db = this.getEmptyDatabase();
        this.saveDatabase();
      }
    } catch (error) {
      console.error('[ADAPTER REPO] Errore caricamento database:', error);
      this.db = this.getEmptyDatabase();
    }
  }

  saveDatabase() {
    try {
      writeFileSync(DB_PATH, JSON.stringify(this.db, null, 2), 'utf8');
      console.log('[ADAPTER REPO] Database salvato');
    } catch (error) {
      console.error('[ADAPTER REPO] Errore salvataggio database:', error);
    }
  }

  getEmptyDatabase() {
    return {
      destinationGroups: [],
      barcodeRules: [],
      loadingUnits: [],
      users: [],
      items: [],
      itemLists: [],
      itemListRows: [],
      missionOperations: [],
      areas: [],
      compartments: [],
      machines: [],
      printers: [],
      products: [],
      putToLightData: [],
    };
  }

  // ============================================
  // ITEMS
  // ============================================

  getItems() {
    return this.db.items || [];
  }

  getItemById(id) {
    return this.db.items.find(item => item.id === parseInt(id));
  }

  getItemByCode(code) {
    return this.db.items.find(item => item.code === code);
  }

  addItem(item) {
    const newId = this.db.items.length > 0
      ? Math.max(...this.db.items.map(i => i.id)) + 1
      : 1;

    const newItem = { id: newId, ...item };
    this.db.items.push(newItem);
    this.saveDatabase();
    return newItem;
  }

  updateItem(id, data) {
    const index = this.db.items.findIndex(item => item.id === parseInt(id));
    if (index === -1) return null;

    this.db.items[index] = { ...this.db.items[index], ...data };
    this.saveDatabase();
    return this.db.items[index];
  }

  // ============================================
  // ITEM LISTS
  // ============================================

  getItemLists() {
    return this.db.itemLists || [];
  }

  getItemListById(id) {
    return this.db.itemLists.find(list => list.id === parseInt(id));
  }

  getItemListByCode(code) {
    return this.db.itemLists.find(list => list.code === code);
  }

  getItemListRows(listId) {
    const rows = this.db.itemListRows.filter(row => row.itemListId === parseInt(listId));

    // Arricchisci con descrizione item
    return rows.map(row => {
      const item = this.getItemById(row.itemId);
      return {
        ...row,
        itemDescription: item ? item.description : null,
      };
    });
  }

  addItemList(list) {
    const newId = this.db.itemLists.length > 0
      ? Math.max(...this.db.itemLists.map(l => l.id)) + 1
      : 1;

    const newList = { id: newId, machines: [], ...list };
    this.db.itemLists.push(newList);
    this.saveDatabase();
    return newList;
  }

  updateItemListStatus(id, status) {
    const list = this.getItemListById(id);
    if (!list) return null;

    list.machines.forEach(machine => {
      machine.status = status;
    });

    this.saveDatabase();
    return list;
  }

  // ============================================
  // MISSION OPERATIONS
  // ============================================

  getMissionOperations() {
    return this.db.missionOperations || [];
  }

  addOperation(itemId, quantity, destinationGroupId, operationType) {
    const item = this.getItemById(itemId);
    if (!item) return null;

    const newId = this.db.missionOperations.length > 0
      ? Math.max(...this.db.missionOperations.map(o => o.id)) + 1
      : 1;

    const operation = {
      id: newId,
      itemId,
      itemCode: item.code,
      quantity,
      destinationGroupId,
      operationType,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    this.db.missionOperations.push(operation);
    this.saveDatabase();
    return operation;
  }

  updateOperationStatus(id, status) {
    const index = this.db.missionOperations.findIndex(op => op.id === parseInt(id));
    if (index === -1) return null;

    this.db.missionOperations[index].status = status;
    this.saveDatabase();
    return this.db.missionOperations[index];
  }

  completeOperationsByListCode(listCode) {
    this.db.missionOperations
      .filter(op => op.itemListCode === listCode)
      .forEach(op => op.status = 'Completed');

    this.saveDatabase();
  }

  // ============================================
  // AREAS
  // ============================================

  getAreas() {
    return this.db.areas || [];
  }

  getAreaById(id) {
    return this.db.areas.find(area => area.id === parseInt(id));
  }

  addArea(area) {
    const newId = this.db.areas.length > 0
      ? Math.max(...this.db.areas.map(a => a.id)) + 1
      : 1;

    const newArea = { id: newId, ...area };
    this.db.areas.push(newArea);
    this.saveDatabase();
    return newArea;
  }

  // ============================================
  // COMPARTMENTS
  // ============================================

  getCompartments() {
    return this.db.compartments || [];
  }

  getCompartmentById(id) {
    return this.db.compartments.find(comp => comp.id === parseInt(id));
  }

  // ============================================
  // MACHINES
  // ============================================

  getMachines() {
    return this.db.machines || [];
  }

  getMachineById(id) {
    return this.db.machines.find(machine => machine.id === parseInt(id));
  }

  updateMachineStatus(id, status) {
    const index = this.db.machines.findIndex(m => m.id === parseInt(id));
    if (index === -1) return null;

    this.db.machines[index].status = status;
    this.saveDatabase();
    return this.db.machines[index];
  }

  // ============================================
  // LOADING UNITS (UDC)
  // ============================================

  getLoadingUnits() {
    return this.db.loadingUnits || [];
  }

  getLoadingUnitById(id) {
    return this.db.loadingUnits.find(unit => unit.Id === parseInt(id));
  }

  addLoadingUnit(unit) {
    const newId = this.db.loadingUnits.length > 0
      ? Math.max(...this.db.loadingUnits.map(u => u.Id)) + 1
      : 2001;

    const newUnit = { Id: newId, ...unit };
    this.db.loadingUnits.push(newUnit);
    this.saveDatabase();
    return newUnit;
  }

  // ============================================
  // USERS
  // ============================================

  getUsers() {
    return this.db.users || [];
  }

  getUserByName(name) {
    return this.db.users.find(user => user.name === name);
  }

  getUserByToken(token) {
    return this.db.users.find(user => user.token === token);
  }

  authenticateUser(name, password) {
    const user = this.db.users.find(
      u => u.name === name && u.password === password
    );
    return user || null;
  }

  // ============================================
  // BARCODE RULES
  // ============================================

  getBarcodeRules() {
    return this.db.barcodeRules || [];
  }

  getBarcodeRuleById(id) {
    return this.db.barcodeRules.find(rule => rule.id === parseInt(id));
  }

  // ============================================
  // PRINTERS
  // ============================================

  getPrinters() {
    return this.db.printers || [];
  }

  getPrinterById(id) {
    return this.db.printers.find(printer => printer.id === parseInt(id));
  }

  // ============================================
  // DESTINATION GROUPS
  // ============================================

  getDestinationGroups() {
    return this.db.destinationGroups || [];
  }

  getDestinationGroupById(id) {
    return this.db.destinationGroups.find(group => group.id === parseInt(id));
  }

  // ============================================
  // PUT TO LIGHT
  // ============================================

  getPutToLightData() {
    return this.db.putToLightData || [];
  }

  addPutToLightData(data) {
    this.db.putToLightData.push(data);
    this.saveDatabase();
    return data;
  }

  // ============================================
  // PRODUCTS
  // ============================================

  getProducts() {
    return this.db.products || [];
  }

  getProductById(id) {
    return this.db.products.find(product => product.id === parseInt(id));
  }
}

// Singleton instance
let repositoryInstance = null;

export function getRepository() {
  if (!repositoryInstance) {
    repositoryInstance = new AdapterRepository();
  }
  return repositoryInstance;
}

export default AdapterRepository;
