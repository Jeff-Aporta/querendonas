const { MongoClient, ServerApiVersion } = require('mongodb');

const config = require("../config");

const MONGO_URI = config.mongo_url

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // serverApi: ServerApiVersion.v1,
    // useCreateIndex: true,
    // useFindAndModify: false,
    // autoIndex: false,
    // poolSize: 10,
    // bufferMaxEntries: 0,
    // connectTimeoutMS: 0,
    // socketTimeoutMS: 0,
    // family: 4
};
const client = new MongoClient(MONGO_URI);

let collections = {
    "pedidos": undefined,
    "main": undefined
}

client.connect(async err => {
    if (err) {
        console.log("Error al conectarse con MONGO: " + err)
    } else {
        database = client.db("Querendonas");
        let names_collections = await database.listCollections().toArray();
        names_collections = names_collections.map(collection=>collection.name)
        for (const name_collection in collections) {
            if (!names_collections.includes(name_collection)) {
                database.createCollection(name_collection)
                console.log("base de datos creada:", name_collection)
            }
            collections[name_collection] = database.collection(name_collection);
        }
        console.log("Todo correcto en MONGO")
    }
});

async function escribir(obj, collection = "main") {
    collection = collections[collection]
    let _id = { _id: obj._id }
    let doc = await collection.findOne(_id)
    if (doc) {
        collection.updateOne(
            _id,
            {
                $set: obj
            },
            {
                upsert: true
            }
        )
    } else {
        collection.insertOne(obj);
    }
}

async function leer(_id, collection = "main") {
    collection = collections[collection]
    let doc = await collection.findOne({ _id });
    return doc
}

async function todosLosDatosAlmacenados(collection = "main") {
    collection = collections[collection]
    return await collection?.find()?.toArray() ?? [];
}

module.exports = {
    escribir,
    leer,
    todosLosDatosAlmacenados
}