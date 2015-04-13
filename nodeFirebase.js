var Firebase = require("firebase");
var fbindex=require("firebaseindex");
var FirebaseIndexView=fbindex.firebaseIndexView;



//--- FirebaseIndexView DINOSAUR  --------------------------------------------------------------------------------------------------------
    
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
    
    var referenceDinosaur = new Firebase("https://dinosaur-facts.firebaseio.com/dinosaurs");
    var referenceDinosaurIDX = new Firebase("https://fireindex.firebaseio.com/IDX-dinosaurs");
    var IndexViewDino = new FirebaseIndexView(referenceDinosaur, indexDeclarationDinosaur, referenceDinosaurIDX); // take Default referenceIndexView

    IndexViewDino.indexOn();
    // use indexOn() if index and data are synchronized
    // use indexRebuild if index and data are not synchronized
    

    //--- FirebaseIndexView DINO MEALS --------------------------------------------------------------------------------------------------------
    
    // mapping and emiting function
    function meals(emit, doc, fullMeal) {
        
        var e,
            meal = doc.meals || {};
        
        for (e in meal) {  // iterate over all meals  drink, food, meat...
            var n = meal[e];
            
            if(!n) continue;
            
            n = n ? n.toLowerCase() : null;
            // iterate and generate an index for each split word in every meal like water, milk, ... in drink 
            n.split(",").forEach(
                function (key) {
                    key = key.trim() + "-" + e;

                    // emit calculated key and value to build the index
                    if (fullMeal === true) {
                        emit(key, meal);
                    } else {
                        var val = doc._linked + " likes following " + e + ": " + meal[e];
                        emit(key, val);
                    }
                }
            );
        }
    }  
       
    var indexDeclarationDinomeals = [
        {
            viewName: 'dino',
            mapView: function (emit, doc) { emit(doc._linked, true); }
        },
        
        {
            viewName: 'singleMeal',
            mapView: [meals,  false]
        },
        
        {
            viewName: 'meals',
            mapView: [meals,  true]
        },
        
        {   
            viewName: 'mealsPerDay',
            mapView:function(emit, doc) {
                
                var key = doc.mealsPerDay || null,
                    ext_doc = IndexViewDino.getLinkedDocument(doc._linked),
                    val = doc.mealsPerDay + " Meals per day" + (ext_doc ? " makes a Dino weight of " + ext_doc.weight : " but no Dino");
                
                emit(key, val);
            }

        },
        
        {
            viewName: 'dinoWithMeal',
            mapView: function (emit, doc) {
                
                var val,
                    key = doc._linked || null,
                    ext_doc = IndexViewDino.getLinkedDocument(doc._linked);
                if (ext_doc) {ext_doc.food = doc; }
                val = ext_doc || 'no dino found';
                emit(key, val);
            }
          
        }
        
    ];
    
    // set your Firebase Account here  or use for demonstration - https://fireindex.firebaseio.com/...
    var firebaseReferenceDinoMeal = "https://fireindex.firebaseio.com/dinomeals";

    // get Firebase - Reference to your Data 
    var referenceDinoMeal = new Firebase(firebaseReferenceDinoMeal);
  
    //  Create an IndexView Object for working on  
    var IndexViewDinoMeals = new FirebaseIndexView(referenceDinoMeal, indexDeclarationDinomeals); // take Default referenceIndexView

    // Let INDEXVIEW automatic working...
    IndexViewDinoMeals.indexOn();
    // use indexOn() if index and data are synchronized
    // use indexRebuild if index and data are not synchronized

console.log("FirebaseIndexServer is running...");
