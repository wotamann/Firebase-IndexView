/*jshint undef: false, maxerr: 512*/
/*
     Firebase IndexView
     @version 0.1.0
     (c) 2015 wotamann
     @license MIT
 */

(function () {
    'use strict';

    // define FirebaseIndexView  module 
    var indexview = angular.module('FirebaseIndexView', []);

    /*
        The `FirebaseIndexView` service is an object which comes with 4 Methods for creating and maintaining Indexes of stored documents (JSON Objects)
        
        'indexOn', 'indexOff', 'indexDelete', 'indexRebuild'  

        Methods to query your documents using your indexes. The Result delivers an Array with your Index Views or with your stored documents. 
        All this methods return a promise and are chainable:
       
        'queryFromTo', 'queryStartAt', 'queryEndAt', 'queryFirst' and 'queryLast'    

    */
    
    indexview.factory('FirebaseIndexView', [

        function () {

            /*
            *   call `FirebaseIndexView` service with or without 'new' 
            *   returns a new instance of an firebaseIndexView object.
            *
            *   @example:
            *   var FirebaseIdx = [new] FirebaseIndexView(referenceData, indexDeclaration, [referenceIndex] );
            *   
            *   @param reference:
            *   reference is a Firebase reference to your Data which should be watched for indexing                 
            *
            *   @param indexDeclaration:
            *   indexDeclaration is an array of index-JSON objects, which describes what to index, 
            *   how to generate the index and the stored view of this index.
            *   @example of one item in indexDeclaration array:
                [...
                    {   
                        viewName: 'documents/MyIndex',
                        mapView: function(emit, doc) {
                            var key=doc.name ? doc.name.toLowerCase() : '',                            
                            emit(key,true);
                        }
                    },                       
                ...]
            *
            *   @param referenceIndex:
            *   referenceIndex is a Firebase reference to the location where you want to store your Index.                
            *   This parameter is optional, if omiting a reference with leading 'IDX-' is used
            *   reference path: 'myproject.firebaseio.com/root/mydata' -> 
            *   referenceIndex path: 'myproject.firebaseio.com/root/IDX-mydata' 
                
            */
            
            return function (reference, indexDeclaration, referenceIndex) {

                // local definitions                
              
                var self = {}, // the 'FirebaseIndexView' object
                    
                    firstRun = true,
                    
                    referenceIndexDefaultHead = "IDX-",
                   
                    // status flag signaling wether your status is 'indexOn' or 'indexOff'
                    indexing = false,

                    // indexCounterLen = 4 -> allows 36 x 36 x 36 x 36 = 1.679.616 different Indexes with same 'Key'. 
                    indexCounterLen = 4,
                    indexCounterFiller = new Array(indexCounterLen ).join('0'),
                     /* 
                        calculate Appendix-Counter from IndexDeclarationIdx for document child key

                        to avoid 'key' duplets every index from indexDeclaration array becomes an base 36 incrementing appendix 01 - ZZ  

                        document    key: -JJQMHDMTAMwG0IY5F00ASr  
                        ->index1    key: -JJQMHDMTAMwG0IY5F00ASr01 
                        ->index2    key: -JJQMHDMTAMwG0IY5F00ASr02
                        ...
                        ->index1296 key: -JJQMHDMTAMwG0IY5F00ASrZZ 
                    */
                    indexCounterGetKeyAppendix = (function () {
                        var c = -1;
                        // indexCounterGetKeyAppendix() = get next key
                        return function (reset) {
                            c += 1;
                            c = reset || c;
                            return indexCounterFiller + c.toString(36).substr(-indexCounterLen);
                        };
                    })(),
                
                    // IDs used to switch off Trigger: reference.off('child_added', refChildAdded )    
                    refChildBuild,
                    refChildAdded,
                    refChildMoved,
                    refChildRemoved,
                    refChildChanged,
                    
                    queryResultArray = [],  // holds the query result                    
                    queryResultUniqe = {},  // hash object for get unique keys in query array

                    idxName,
                    removeFlag,
                    mapView,
                    mapViewParams,
                    priority,
                    value,
                    snapValue,
                    snapKeyWithHeader;
                    // var local
                    
                    
                
                // if no reference to Firebase exists, throw error                                    
                if (!reference) {
                    throw "There is no valid Firebase reference!";
                }

                // if no IndexView declaration array exists, throw error                
                if (!Array.isArray(indexDeclaration) || indexDeclaration.length === 0 || typeof indexDeclaration[0] !== 'object') {
                    throw "There is no valid declaration of an 'IndexView' array!";
                }

                /*                    
                    is referenceIndex undefined, generate IDX with DefaultHeader 'IDX-' as Child of your data reference
                    reference: /root/base/person  ->  referenceIndex: /root/base/IDX-person                     
                */
                referenceIndex = referenceIndex || reference.parent().child(referenceIndexDefaultHead + reference.toString().match(/([^\/]*)\/*$/)[1]);

                /* 
                    WARNING this needed otherwise query full Object doesn't work if 'Index OFF'
                */
             //   reference.once('value', function () {});

                // Helper Functions --------------------------------------------------------------------------                   
                function isString(t) {
                    return Object.prototype.toString.call(t) === '[object String]';
                }

                function isNumber(n) {
                    return !isNaN(parseFloat(n));
                }

                // check for string and invalid chars in Firebase path 
                function isPath(t) {
                    return isString(t) && /^[^#$.\[\]\\]+$/i.test(t);
                }

                // if elems from a document are removed only 'child_changed' event is triggered -> delete this removed elems from document 
                function removeLostKeys(snapshot) {
                    
                    var start = snapshot.key() + indexCounterGetKeyAppendix(),
                        end = snapshot.key() + '\uFFFF',
                        removeQuery = referenceIndex.child(idxName).orderByKey().startAt(start).endAt(end);
                    
                    removeQuery.once('value', function (dataSnapshot) {
                        dataSnapshot.forEach(function (snap) {
                            // console.log("REMOVE SNAP:",snap.key(),snap.val(), start,end);
                            snap.ref().remove();
                        });
                    });
                }
                
                // emit generates index(property) and value in index-database 
                function emit(priority, value) {
                    
                    // if value undefined, set value to 'null' to remove remove key-node from referenceIndex in Firebase
                    if (typeof value === 'undefined') {
                        value = null;
                    }
                    
                    // priority === undefined  -> creates NO Index or remove existing Index 
                    // priority === null -> creates an Index with priority null (ordered at first )
                    if (typeof priority === 'undefined') {
                        priority = null;
                        value = null;
                    }

                    if (removeFlag === true) { // triggered 'child_removed' event removes this child
                        value = null;
                    }

                    //console.log( "snapValue EMIT: ", idxName,priority, value);                    
                    referenceIndex.child(idxName).child(snapKeyWithHeader()).setWithPriority(value, priority);

                }
                
                // IndexView Handler --------------------------------------------------------------------------------                
                /* 'indexHandle' -> main routine maintaining the index
                    
                    each fired event like 'child_added', 'child_added', 'child_changed', 'child_moved', 'child_removed' 
                    will call 'indexHandle', which sets/updates index and view using indexDeclaration array as template

                    event 'child_removed' sets flag parameter 'remove' to 'true' 
                    event 'child_added' sets flag parameter 'remove' to 'false'
                    all other events let flag parameter 'remove' undefined 
                */
                function indexHandle(snapshot, remove) {

                    var i, ix;
                    
                     // no valid snapshot to work on...
                    if (!snapshot || snapshot.exists() === false) {
                        return;
                    }
                    
                    // used in emit and set removeFlag
                    removeFlag = remove;
                    // used in emit and create the child key 
                    snapKeyWithHeader = function () { return snapshot.key() + indexCounterGetKeyAppendix(); };
                                       
                    // get Document which can be used in mapView() to generate your Index and View 
                    snapValue = snapshot.val() || {};
                    
                    // add Property _key and _priority to Value Object this allows to reference to the Key  
                    snapValue._key = snapshot.key();
                    snapValue._priority = snapshot.getPriority();

                    // iterate over indexDeclaration Array                     
                    for (i = 0; i < indexDeclaration.length; i += 1) {

                        // reset Key-Header for each index in Array    
                        indexCounterGetKeyAppendix(-1);

                        ix = indexDeclaration[i];

                        // viewName
                        idxName = ix.viewName;
                        // is idxName nit a valid path skip and take next from indexDeclaration Array 
                        if (isPath(idxName) === false) {
                            console.warn("Skip Index Name: '" + idxName + "', because 'viewName' in indexDeclaration array must be non-empty string and can't contain '.', '#', '$', '\\', '[', or ']'");
                            continue;
                        }

                        //  mapView  
                        mapView = ix.mapView;
                        mapViewParams = (typeof mapView === 'object') ? Object.create(mapView) : [];
                        // if mapView isArray try get FN from first item in Array
                        mapView = Array.isArray(mapView) ? mapView[0] : mapView;
                        // at this point mapView must be a 'function' returning a valid Firebase value (string, object, number) 
                        if (typeof mapView !== 'function') {
                            console.warn("'mapView' must be a valid function which emits an valid Firebase priority and value (string, object, number) - mapView:", mapView);
                            continue; // if mapView no FN then skip and take next from indexDeclaration Array   
                        }
  
                        // set first parameter in parameter-array with the document, which triggered the event for building Index.
                        mapViewParams[0] = snapValue;
                        // set first parameter in parameter-array with emit(key,value) function.
                        mapViewParams.unshift(emit);
                        // execute mapView function
                        value = mapView.apply(null, mapViewParams);
                        
                        // no child_changed=false or child_remove=true -> exit and continue 
                        if (typeof remove === 'undefined') {
                            continue;
                        }
                        // controls removed elems in doc, because removing a element of doc generates a 'child_changed' event and not a 'child_removed'!       
                        removeLostKeys(snapshot);

                    }
                }
                
                // Query Functions --------------------------------------------------------------------------------------

                /*  
                 *  @param index
                 *  could be any Index Item from indexDeclaration Array
                 *  ie. 'indexDeclaration[0]'  or Index-Object { viewName: 'myviewName', ... } or matching viewName as string from Index-Object
                 *
                 */
                function checkIndex(index) {
                    // index could be Index Object or the viewName as string from Index Object
                    return (typeof index === 'object') ? index.viewName : index;
                }
                
                function queryReduce(queryResultArray, ReduceFN) {
                    
                    // SAMPLE OF REDUCE FUNCTION
                    // function ReduceFN(previousValue, currentValue, index, array) {
                    //      return previousValue + currentValue;
                    //  };
                
                    // array.length <= 1 don't reduce send single object or empty array 
                    if (!queryResultArray || queryResultArray.length <= 1) {
                        return queryResultArray;
                    }
                    
                    if (!ReduceFN ||  typeof ReduceFN !== 'function') {
                        return queryResultArray;
                    }
                    
                    var reduced = {},
                        // try to take the name property of reduce function, if not available take 'Reduced'
                        name = ReduceFN.name.length !== 0 ? ReduceFN.name : 'Reduced';
                    
                    // create object with result from reducing 
                    reduced[name] = queryResultArray.reduce(ReduceFN);
                    queryResultArray = [];
                    queryResultArray.push(reduced);
                    return queryResultArray;
                   
                }
                
                function queryDocument(ref, dataSnapshot, sort, unique, queryResultArray, ReduceFn) {

                    var q;

                    dataSnapshot.forEach(function (i) {
                        
                        ref.child(i.key().slice(0, -indexCounterLen)).once('value', function (d) {

                            if (!unique || !queryResultUniqe[d.key()]) {
                                q = {
                                    property: i.getPriority(),
                                    key: d.key(),
                                    value: d.val()
                                };

                                if (sort) {
                                    queryResultArray.push(q);
                                } else {
                                    queryResultArray.unshift(q);
                                }

                                queryResultUniqe[d.key()] = true;
                            }

                        });
                    });

                    return queryReduce(queryResultArray, ReduceFn);
                }

                function queryView(dataSnapshot, sort, unique, queryResultArray, ReduceFn) {

                    var q, k;

                    dataSnapshot.forEach(function (i) {
                        
                        k = i.key().slice(0, -indexCounterLen);
                        
                        if (!unique || !queryResultUniqe[k]) {

                            q = {
                                property: i.getPriority(),
                                key: k,
                                value: i.val()
                            };

                            if (sort) {
                                queryResultArray.push(q);
                            } else {
                                queryResultArray.unshift(q);
                            }

                            queryResultUniqe[k] = true;
                        }
                        
                    });

                    return queryReduce(queryResultArray, ReduceFn);
                }

                function queryProperty(dataSnapshot, sort, unique, queryResultArray, ReduceFn) {

                    var k;

                    dataSnapshot.forEach(function (i) {
                        
                        k = i.key().slice(0, -indexCounterLen);
                        
                        if (!unique || !queryResultUniqe[k]) {

                            if (sort) {
                                queryResultArray.push(i.getPriority());
                            } else {
                                queryResultArray.unshift(i.getPriority());
                            }

                            queryResultUniqe[k] = true;
                        }

                    });

                    return queryReduce(queryResultArray, ReduceFn);
                }
                
                function queryKey(dataSnapshot, sort, unique, queryResultArray, ReduceFn) {

                    var k;

                    dataSnapshot.forEach(function (i) {
                        
                        k = i.key().slice(0, -indexCounterLen);
                        
                        if (!unique || !queryResultUniqe[k]) {

                            if (sort) {
                                queryResultArray.push(k);
                            } else {
                                queryResultArray.unshift(k);
                            }

                            queryResultUniqe[k] = true;
                        }
                        
                    });

                    return queryReduce(queryResultArray, ReduceFn);
                }

                function queryValue(dataSnapshot, sort, unique, queryResultArray, ReduceFn) {

                    var k;

                    dataSnapshot.forEach(function (i) {
                        
                        k = i.key().slice(0, -indexCounterLen);
                        
                        if (!unique || !queryResultUniqe[k]) {

                            if (sort) {
                                queryResultArray.push(i.val());
                            } else {
                                queryResultArray.unshift(i.val());
                            }

                            queryResultUniqe[k] = true;
                        }
     
                    });
  
                    return queryReduce(queryResultArray, ReduceFn);
                   
                }
                
                function queryDo(refData, refQuery, sort, unique, output, queryResultArray, ReduceFN) {

                    console.time("Query");
                    
                    queryResultArray = queryResultArray || [];
                    queryResultUniqe = (queryResultArray.length !== 0) ? queryResultUniqe : {};
            
                    return new Promise(function (resolve, reject) {
                        refQuery.once('value', function (dataSnapshot) {

                            switch (output) {

                            case 'P':  // output only key
                                resolve(queryProperty(dataSnapshot, sort, unique, queryResultArray, ReduceFN));
                                break;
                            case 'K':  // output only key
                                resolve(queryKey(dataSnapshot, sort, unique, queryResultArray, ReduceFN));
                                break;
                            case 'V': // output only value
                                resolve(queryValue(dataSnapshot, sort, unique, queryResultArray, ReduceFN));
                                break;
                            case 'D': // output view -> idx key value
                                resolve(queryDocument(refData, dataSnapshot, sort, unique, queryResultArray, ReduceFN));
                                break;
                            default: // output doc -> idx key doc
                                resolve(queryView(dataSnapshot, sort, unique, queryResultArray, ReduceFN));
                                break;

                            }
                       
                            console.timeEnd("Query");

                        }, function (errorObject) {
                            reject(errorObject);
                        });

                    });
                }

                // Methods to manage Index --------------------------------------------------------------------     
               
                // flag holding status of indexing 
                self.isIndexing = function () {
                    return indexing;
                };
                
                // Start / Stop automatic indexing
                self.indexOn = function (rebuild) {

                    if (indexing === true || !referenceIndex || !reference) {
                        return;
                    }

                    // set on for data from lastdata beginning
                    refChildBuild = reference.on('child_added', function (snapshot) {
                        if (firstRun === false || rebuild === true) {
                            indexHandle(snapshot);
                        }
                    });
                    if (firstRun === true) {
                        reference.once('value', function (snapshot) {
                            firstRun = false;
                        });
                    }

                    refChildChanged = reference.on('child_changed', function (snapshot, oldsnapshot) {
                        indexHandle(snapshot, false);
                    });

                    refChildMoved = reference.on('child_moved', function (snapshot) {
                        indexHandle(snapshot);
                    });

                    refChildRemoved = reference.on('child_removed', function (snapshot) {
                        indexHandle(snapshot, true);
                    });

                    indexing = true;

                };
                self.indexOff = function () {

                    if (indexing === false || !referenceIndex || !reference) {
                        return;
                    }

                    //reference.off();    // cancel all events from your reference

                    // cancel events from your reference    
                    reference.off('child_added', refChildBuild);
                    reference.off('child_added', refChildAdded);
                    reference.off('child_changed', refChildChanged);
                    reference.off('child_moved', refChildMoved);
                    reference.off('child_removed', refChildRemoved);

                    indexing = false;
                    firstRun = true;
                };

                // Delete / Rebuild Index
                self.indexDelete = function () {

                    if (!referenceIndex || !reference) {
                        return;
                    }

                    self.indexOff();

                    referenceIndex.set(null, function (error) { // delete INDEX
                        if (error) {
                            console.warn('Deleting Index failed with Error:', error);
                        }

                    });

                };
                self.indexRebuild = function () {

                    self.indexOff();
                    self.indexOn(true); // rebuild flag

                };

                // Methods to query (all query functions return a Promise) ------------------------------------    

                /*
                *   queryFromTo(index, startAt, endAt, sort, view, [queryResultArray])
                *   
                *   @param index:
                *   could be any index item from indexDeclaration array ie. 'indexDeclaration(0)'  or a string matching viewName in any index item               
                *
                *   @param startAt:
                *   search term from 
                *
                *   @param endAt:
                *   search term to
                *
                *   @param sort:
                *   boolean true delivers a up-sorted array 
                *
                *   @param unique:
                *   boolean true delivers an array without double keys   
                *
                *   @param output:
                *   'P'  delivers a queryResultArray filled with properties
                *   [ property1, property2, ... ]
                
                *   'K'  delivers a queryResultArray filled with keys
                *   [ key1, key2, ... ]
                
                *   'V'  delivers a queryResultArray filled with values
                *   [ value1, value2, ... ]
                
                *   'D'  delivers a queryResultArray filled with origin documents (JSON)
                *   [ ... {  property:'...', key:'...', value: JSON-document } ... ]
                
                *   '' any other string delivers a queryResultArray filled with index views (JSON)
                *   [ ... { property:'...', key:'...', value: JSON-VIEW Object } ... ]
                *   
                *   @param [queryResultArray]
                *   queryResultArray is optional. If undefined generate new queryResult,
                *   otherwise extend the existing queryResultArray with the new result.
                *   
                *   @example query chaining with promise:
                    FirebaseIdx.queryFromTo(index1, termFrom1, termTo1, sort, unique, output)        
                    .then( function(result1)
                    {            
                        return FirebaseIdx.queryFromTo(index2, termFrom2, termTo2, sort, unique, output, result1)  // here pass in result1   
                    })        
                    .then( function(result2){
                        // ... use result2 ...
                    });
                *
                */
                self.queryFromTo = function (index, startAt, endAt, sort, unique, output, queryResultArray, ReduceFn) {

                    index = checkIndex(index);

                    // if endAt undefined then find all startAt
                    endAt = endAt || startAt;

                    var queryRef = referenceIndex.child(index).startAt(startAt).endAt(endAt);

                    return queryDo(reference, queryRef, sort, unique, output, queryResultArray, ReduceFn); // // return Promise

                };

                self.queryStartAt = function (index, startAt, limit, sort, unique, output, queryResultArray, ReduceFn) {

                    index = checkIndex(index);
                    limit = limit || 1;
                    var queryRef = referenceIndex.child(index).startAt(startAt).limitToFirst(limit);

                    return queryDo(reference, queryRef, sort, unique, output, queryResultArray, ReduceFn); // // return Promise

                };

                self.queryEndAt = function (index, endAt, limit, sort, unique, output, queryResultArray, ReduceFn) {

                    index = checkIndex(index);
                    limit = limit || 1;
                    var queryRef = referenceIndex.child(index).endAt(endAt).limitToLast(limit);

                    return queryDo(reference, queryRef, sort, unique, output, queryResultArray, ReduceFn); // return Promise

                };

                self.queryFirst = function (index, startAt, output, queryResultArray) {
                    return self.queryStartAt(index, startAt, 1, true, true, output, queryResultArray); // return Promise
                };

                self.queryLast = function (index, endAt, output, queryResultArray) {
                    return self.queryEndAt(index, endAt, 1, true, true, output, queryResultArray); // return Promise
                };
               
                /* 
                
                Get an linked object from your record with a property 'record._linked=keyOfLinkedObject'
                
                // get Firebase - Reference to Dinosaur 
                var referenceDinosaur = new Firebase("https://dinosaur-facts.firebaseio.com/dinosaurs");
                var referenceDinosaurIDX = new Firebase("https://[MyFirebaseAccount].firebaseio.com/IDX-dinosaurs");
                //  Create an IndexView Object for working on Dinosaur Data with Indexes on your FirebaseAccount (because Dinosaur is only readable!) 
                var IndexViewDino = FirebaseIndexView(referenceDinosaur, indexDeclarationDino, referenceDinosaurIDX); // take Default referenceIndexView

                // get Firebase - Reference to your Data 
                var reference = new Firebase(firebaseReference);
                //  Create an IndexView Object for working on  
                var IndexViewDinoMeals = FirebaseIndexView(reference, indexDeclarationDinoMeals); // take Default referenceIndexView

                indexDeclarationDinoMeals 
                [
                    {   
                        viewName: 'mealsPerDay',
                        mapView:function(emit, doc) {

                            var key=doc.mealsPerDay || null,
                                dinosaur=IndexViewDino.getLinkedDocument(doc._linked),
                                
                            emit(key,dinosaur);
                        }   

                    }, 
                    ...
                ]
                
                // set property '_linked' in dinomeals JSON-Object with key from dinosaur  
                dinomeal._linked=dinosaurKey;      
                reference.push(dinomeal);
                 
                // get linked dino via property '_linked'
                function(emit, doc) { 
                        // get in Dinomeal linked Dinosaur with .getLinkedDocument(doc._linked)
                        var linkedDino = IndexViewDino.getLinkedDocument(doc._linked);     
                 }
                */
                self.getLinkedDocument = function (linkingKey) {

                    var snapvalue;

                    if (!isPath(linkingKey)) {
                        console.warn("Linking Key '" + linkingKey + "' must be non-empty string and can't contain '.', '#', '$', '\\', '[', or ']'");
                        return null;
                    }
                    
                    reference.child(linkingKey).once('value', function (snapshot) {
                        if (snapshot.exists() === true) {
                            snapvalue = snapshot.val();
                        }
                    });

                    return snapvalue || null;

                };

                return self;

            };

        }]);

}());