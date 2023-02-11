const { GoogleSpreadsheet } = require("google-spreadsheet")

const config = require("../config");
const fetch = require("node-fetch")
const credenciales = config.spreadsheets

const NAME_SHEET = "registros"
let rangoDeAplicación = "A1:K6000"
let rangoHeaders = "A1:K1"
let ID_DOCUMENT
let URL_TSV

async function getHeaders() {
    const doc = new GoogleSpreadsheet(ID_DOCUMENT);
    await doc.useServiceAccountAuth(credenciales);
    await doc.loadInfo();

    let sheet
    for (const s of doc.sheetsByIndex) {
        if (s.title == NAME_SHEET) {
            sheet = s
            break
        }
    }

    await sheet.loadCells(rangoHeaders);
    let headers = []
    while (true) {
        let cell = sheet.getCell(0, headers.length);
        if (cell.value == "" || cell.value == null) {
            break
        }
        headers.push(cell.value)
    }
    return headers
}

async function getUsersFromTable_TSV() {
    let data = await fetch(URL_TSV)
    let texto = await data.text()
    let renglones = texto.split("\n")
    headers = renglones[0].split("\t")
    let retorno = []
    for (let i = 1; i < renglones.length; i++) {
        let obj = {}
        const renglon = renglones[i].split("\t");
        for (let c = 0; c < renglon.length; c++) {
            obj[headers[c]] = renglon[c]
        }
        retorno.push(obj)
    }
    return retorno;
}

async function getUsersFromTable() {
    const doc = new GoogleSpreadsheet(ID_DOCUMENT);
    await doc.useServiceAccountAuth(credenciales);
    await doc.loadInfo();
    let sheet
    for (const s of doc.sheetsByIndex) {
        if (s.title == NAME_SHEET) {
            sheet = s
            break
        }
    }
    await sheet.loadCells(rangoDeAplicación);
    let headers = await getHeaders()
    let objs = []
    let hayDatos = true
    while (hayDatos) {
        let obj = {}
        let columna = 0
        for (; columna < headers.length; columna++) {
            let cell = sheet.getCell(objs.length + 1, columna);
            if (columna == 0 && cell.value == null) {
                hayDatos = false
                break
            }
            obj[headers[columna]] = cell.value
        }
        if (columna) {
            objs.push(obj)
        }
    }
    return objs
}

async function addUser(obj) {
    let consulta = await getUser(obj.celular)
    if (consulta) {
        return false
    }
    obj.cupones = "[]"
    obj.creditos = 0
    obj.fecha_registro = new Date().yyyymmdd()
    obj.fecha_nacimiento = ""
    obj.roll = "cliente"
    obj.bloqueado = "NO"
    obj.pedidos = "[]"
    const doc = new GoogleSpreadsheet(ID_DOCUMENT);
    await doc.useServiceAccountAuth(credenciales);
    await doc.loadInfo();

    let sheet
    for (const s of doc.sheetsByIndex) {
        if (s.title == NAME_SHEET) {
            sheet = s
            break
        }
    }

    await sheet.loadCells(rangoDeAplicación);

    let headers = await getHeaders()

    let fila = 1
    let buscarEspacio = true
    while (buscarEspacio) {
        let cell = sheet.getCell(fila, 0);
        if (obj.celular == cell.value) {
            return false
        }
        if (cell.value == null) {
            for (let columna = 0; columna < headers.length; columna++) {
                newCell = sheet.getCell(fila, columna)
                newCell.value = obj[headers[columna]] ?? ""
            }
            buscarEspacio = false
            break
        }
        fila++
    }
    await sheet.saveUpdatedCells();
    return true
}

async function getUser(celular) {
    let objs = await getUsersFromTable()
    for (const o of objs) {
        if (o.celular == celular) {
            return o
        }
    }
    return undefined
}

async function getUser_TSV(celular) {
    let objs = await getUsersFromTable_TSV()
    for (const o of objs) {
        if (o.celular == celular) {
            return o
        }
    }
    return undefined
}

async function updateUser(obj) {
    let consulta = await getUser(obj.celular)
    if (!consulta) {
        return
    }

    const doc = new GoogleSpreadsheet(ID_DOCUMENT);
    await doc.useServiceAccountAuth(credenciales);
    await doc.loadInfo();

    let sheet
    for (const s of doc.sheetsByIndex) {
        if (s.title == NAME_SHEET) {
            sheet = s
            break
        }
    }

    await sheet.loadCells(rangoDeAplicación);

    let headers = await getHeaders()

    let fila = 1
    while (true) {
        let cell = sheet.getCell(fila, 0);
        if (cell.value == null) {
            break
        }
        if (cell.value == obj.celular) {
            for (let columna = 0; columna < headers.length; columna++) {
                newCell = sheet.getCell(fila, columna)
                newCell.value = obj[headers[columna]]
            }
        }
        fila++
    }
    await sheet.saveUpdatedCells();
}

module.exports = function (_ID_DOCUMENT, _URL_TSV) {
    ID_DOCUMENT = _ID_DOCUMENT
    URL_TSV = _URL_TSV
    return {
        addUser,
        updateUser,
        getUser,
        getUsersFromTable,
        getUsersFromTable_TSV,
        getUser_TSV
    }
}