var Firebase = require("firebase");
var fbindex=require("firebaseindex");

var FirebaseIndexView=fbindex.firebaseIndexView;


var indexDeclarationDinosaur = [

    {
        viewName: 'volume',
        mapView: function (emit, doc) {
            var key = doc.length && doc.weight ? (doc.length * doc.weight) : null,
                val = (doc.length && doc.weight) ?  doc._key + ' has a volume from  ' + (doc.length * doc.weight) : "no volume";
            emit(key, val);
        }
    },
    {
        viewName: 'timespan',
        mapView: function (emit, doc) {
            var key = doc.appeared && doc.vanished ? (doc.vanished - doc.appeared) : null,
                val = (doc.appeared && doc.vanished) ?  doc._key + ' lives ' + (doc.vanished - doc.appeared) + ' years.' : "no timespan";
            emit(key, val);
        }
    },
    {
        viewName: 'isFlying',
        mapView: function (emit, doc) {
            if ((doc.order === 'ornithischia') === true) {
                emit(doc._key, true);
            }
        }
    },

    {   
        viewName: 'weight'
    },

    {   
        viewName: 'order',                        
        mapView: function(emit, doc){ 
            var k= doc.order ? doc.order.toLowerCase() : null,
                v= (doc.order && doc._key) ?  doc._key + ' belongs to ' + doc.order : null 

        emit(k,v)

        },
    }       

];

// targets your firebase account with data  
var referenceDinosaur = new Firebase("https://dinosaur-facts.firebaseio.com/dinosaurs");

// targets your firebase account to create index 
throw("REPLACE in nodeFirebase.js Line 56: 'https://[YOUR ACCOUNT].firebaseio.com/IDX-dinosaurs' with your Account");   
var referenceIDX = new Firebase("https:// [YOUR ACCOUNT] .firebaseio.com/IDX-dinosaurs");

// get IndexView object
var IndexView = new FirebaseIndexView(referenceDinosaur, indexDeclarationDinosaur, referenceIDX); // take Default referenceIndexView


// use On if index and data are synchronized
//IndexView.indexOn();

// use Rebuild if index and data are not synchronized
IndexView.indexRebuild();

console.log("FirebaseIndexServer is running...");
