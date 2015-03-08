/*
     Firebase IndexView
     @version 0.0.5
     (c) 2015 wotamann
     @license MIT
 */
(function () {
    'use strict';

    // define FirebaseIndexView  module 
    var indexview = angular.module('FirebaseIndexView', [])

    /*
        The `FirebaseIndexView` service is an object which comes with methods for building and controlling the Index
        
        'indexOn', 'indexOff', 'isIndexing', 'indexDelete' and 'indexRebuild' 

        And methods, which make a query over your index. The Result delivers an Array with your Index Views or with your stored Documents. 
        All this methods return a promise:
       
        'queryFromTo', 'queryStartAt', 'queryEndAt', 'queryFirst' and 'queryLast'    

    */
    indexview.factory('firebaseIndexView', [

        function () {
           
            /*
            *   call `FirebaseIndexView` service with or without 'new' 
            *   return is always a new instance of an firebaseIndexView - Object.
            *
            *   @example:
            *   var firebaseIdx = firebaseIndex(referenceData, indexDeclaration, [referenceIndex] );
            *   or 
            *   var firebaseIdx = new firebaseIndex(referenceData, indexDeclaration, [referenceIndex] );
            *
            *   @param reference:
            *   reference is a Firebase reference to your Data which should be watched for indexing                 
            *
            *   @param indexDeclaration:
            *   indexDeclaration is an array of index-JSON objects, which describes what to index, 
            *   how to generate the index and the stored view of this index.
            *   @example of one item in indexDeclaration array:
                [...
                {   indexName: 'name',                        
                    mapIndex: function(doc){ return doc.firstname ? doc.firstname.toLowerCase() : '' },
                    mapView:  function(doc){ return (doc.firstname && doc.lastname) ?  doc.firstname + ' ' + doc.lastname : undefined }
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

                 // minimal pub/sub eventHandler
                var eventHandler= (function () {
                /*
                        eventHandler.subscribe('topic',function(msg) {console.log(msg);});
                        eventHandler.publish('topic', "a msg");
                */
      
                return {
                    channels: {},
                    
                    subscribe: function (channel,listener) {
                        // create the topic if not yet created
                        if (!this.channels[channel]) this.channels[channel] = [];
                        // add the listener
                        this.channels[channel].push(listener);
                    },

                    publish: function (channel, data) {
                        // return if the topic doesn't exist, or there are no listeners
                        if (!this.channels[channel] || this.channels[channel].length < 1) return;
                        // send the event to all listeners
                        this.channels[channel].forEach(function (listener) {
                            listener(data || {});
                        });
                    }
                }
            })();
                    
                    
                // local definitions                
                var referenceIndexDefaultHead = "IDX-",
                    referenceIndexDefaultName,
                    // if no 'mapView' defined then defaultMapView becomes the value in your index 
                    // Default = true
                    defaultMapView = true,

                    // status flag signaling wether your status is 'indexOn' or 'indexOff'
                    indexing = false,

                    // allows 1296 different Index Definitions with same 'indexName'. You need more? Set indexCounterLen = 3 
                    indexCounterLen = 2,
                    indexCounterFiller = new Array(indexCounterLen + 1).join('0'),

                    // IDs used to switch off Trigger: reference.off('child_added', refChildAdded )    
                    refChildBuild,
                    refChildAdded,
                    refChildMoved,
                    refChildRemoved,
                    refChildChanged,
                    refFirstRun=true,
                    
                    // holds the query result
                    queryResultArray = [],

                    // hash object for get unique keys in query array
                    queryUniqe = {};
                    
                // if no reference to Firebase exists, throw error                                    
                if (!reference) {
                    throw "There is no valid Firebase reference!";
                };

                // if no IndexView declaration array exists, throw error                
                if (!Array.isArray(indexDeclaration) || indexDeclaration.length === 0 || typeof indexDeclaration[0] !== 'object') {
                    throw "There is no valid declaration of an 'IndexView' array!";
                };

                /*
                    'referenceIndexDefaultName' holds the name from last child in your reference with DefaultHeader 'IDX-'
                    reference: /root/base/person  ->  referenceIndex: /root/base/IDX-person
                */
                referenceIndexDefaultName = referenceIndexDefaultHead + reference.toString().match(/([^\/]*)\/*$/)[1];

                // if referenceIndex is undefined generate IDX as Child of your Data with Name 'referenceIndexDefaultName'
                referenceIndex = referenceIndex || reference.parent().child(referenceIndexDefaultName);

                // WARNING this needed otherwise query full Object doesn't work if 'Index OFF'
                reference.once('value', function () {});

                // Helper Functions --------------------------------------------------------------------------                   
                function isString(t) {
                    return Object.prototype.toString.call(t) === '[object String]'
                }

                function isNumber(n) {
                    return !isNaN(parseFloat(n))
                }

                // check for string and invalid chars in Firebase path 
                function isPath(t) {
                    return isString(t) && /^[^#$.[\]\\]+$/i.test(t);
                };

                // delete all properties with value 'undefined' from an object
                function deleteUndefinedProperty(obj) {

                    var value, prop;

                    for (prop in obj) {
                        value = obj[prop];
                        if (typeof value === 'object') deleteUndefinedProperty(value); // recursive call
                        if (typeof value === 'undefined') delete obj[prop]; // delete property 
                    }

                    return obj;
                }

                /* 
                    calculate Appendix-Counter from IndexDeclarationIdx for document child key
                    
                    to avoid 'key' duplets every index from indexDeclaration becomes an Base 36 incrementing Appendix to the Key 
                    
                    document key: -JJQMHDMTAMWG0IY5F00AS:  
                    ->index1 key: -JJQMHDMTAMWG0IY5F00AS:01 
                    ->index2 key: -JJQMHDMTAMWG0IY5F00AS:02 
                */
                function indexCounterKeyHeader(i) {
                    return (indexCounterFiller + i.toString(36)).substr(-indexCounterLen);
                };

                function updater(){};  // default Function to be replaced by 
                // INDEX MAKER --------------------------------------------------------------------------------

                /* 'indexHandle' -> main routine maintaining the index
                    
                    each fired event like 'child_added', 'child_added', 'child_changed', 'child_moved', 'child_removed' 
                    will call 'indexHandle', which sets/updates index and view using indexDeclaration array as template

                    event 'child_removed' sets flag parameter 'remove' to 'true' 
                */
                function indexHandle(referenceIndex, indexDeclaration, snapshot, remove) {

                    console.time("set Index")   

                    var ix,
                        idxName,
                        mapIndex,
                        mapIndexParams,
                        mapString,
                        mapView,
                        mapViewParams,
                        priority,
                        value,
                        snapValue;

                    // no valid snapshot to work on...
                    if (snapshot.exists()===false) return;
                    // get Document which can be used in mapView() and mapIndex() to generate your Index or View 
                    snapValue = snapshot.val() || {};
                    // add Property _key to Value Object this helps you if necessary to reference to the Key  
                    snapValue._key = snapshot.key();

                    // iterate over indexDeclaration Array                     
                    for (var i = 0; i < indexDeclaration.length; i++) {

                        ix = indexDeclaration[i];

                        // set and check indexName
                        idxName = ix.indexName;

                        // is idxName nit a valid path skip and take next from indexDeclaration Array 
                        if (isPath(idxName) === false) {
                            console.warn("Skip Index Name: '" + idxName + "', because 'indexName' in indexDeclaration array must be non-empty string and can't contain '.', '#', '$', '\\', '[', or ']'");
                            continue;
                        }

                        //  handle MAP INDEX 
                        mapIndex = ix.mapIndex;
                        mapIndexParams = (typeof mapIndex === 'object') ? Object.create(mapIndex) : [];
                        mapIndex = Array.isArray(mapIndex) ? mapIndex[0] : mapIndex; // if mapIndex isArray try get FN from first item in Array
                        if (isString(mapIndex)) {
                            var s = mapIndex;
                            mapIndex = function (doc) {
                                return doc[s];
                            };
                        } // is mapIndex only a string then, try this string as property of doc. - document[string]  
                        if ((mapIndex === null)) {
                            mapIndex = function (i) {
                                return null;
                            }
                        }; // if mapIndex is null then FN returns null, what is a valid index (is a Firebase priority)
                        // mapIndex undefined try value of indexName as property of the doc
                        if ((typeof mapIndex === 'undefined')) {
                            mapIndex = function (doc) {
                                return doc[idxName];
                            }
                        };

                        // at this point mapIndex must be a function and returning an index (is ident with a Firebase priority) 
                        // otherwise skip this index and take next item from indexDeclaration Array 
                        if (typeof mapIndex !== 'function') {
                            console.warn("'mapIndex' " + idxName + " must be a valid function which returns an index (valid Firebase priority) as string");
                            continue;
                        }

                        // set first parameter in parameter-array with the document, which triggered the event.
                        mapIndexParams[0] = snapValue;

                        // call function mapIndex with parameter-array. mapIndex should return a valid index (is a Firebase priority)                        
                        priority = mapIndex.apply(null, mapIndexParams);

                        // if priority is undefined then remove this index and view from firebase
                        if (typeof priority === 'undefined') {
                            referenceIndex.child(idxName).child(snapshot.key() + indexCounterKeyHeader(i)).remove();
                            continue;
                        }

                        // only string, number or null allowed as priority (can be controlled in function mapIndex),
                        // otherwise skip and take next item from indexDeclaration Array 
                        if ((priority === null || isString(priority) || isNumber(priority)) === false) {
                            console.warn(priority + " is the return of mapIndex '" + idxName + "'. The return value must be a valid Firebase priority (a string, number or null)!");
                            continue;
                        }
                        // console.log(priority, " priority as return of mapIndex in " + idxName + " --------------------------- ---------------------------");


                        //  handle MAP VIEW 
                        mapView = ix.mapView;
                        mapViewParams = (typeof mapView === 'object') ? Object.create(mapView) : [];
                        // if mapView isArray try get FN from first item in Array
                        mapView = Array.isArray(mapView) ? mapView[0] : mapView;
                        // is mapView a string value then try string as property of the doc ( doc[mapView]) 
                        if (isString(mapView)) {
                            var s = mapView;
                            mapView = function (i) {
                                return i[s];
                            };
                        }
                        //  undefined mapView take value of variable 'defaultMapView'
                        if (typeof mapView === 'undefined') {
                            mapView = function (i) {
                                return defaultMapView;
                            };
                        } //  undefined mapView take value of variable 'defaultMapView'

                        // at this point mapView must be a function and returning a valid Firebase value (string, object, number) 
                        // otherwise skip this index and take next item from indexDeclaration Array 
                        if (typeof mapView !== 'function') {
                            console.warn("'mapView' must be a valid function which returns an valid Firebase value (string, object, number) - mapView:", mapView);
                            continue; //if mapView no FN then skip and take next from indexDeclaration Array   
                        }

                        // set first parameter in parameter-array with the document, which triggered the event for building Index.
                        mapViewParams[0] = snapValue;

                        // call function mapView with parameter-array. mapView should return a valid Firebase value (string, object, number)                       
                        value = mapView.apply(null, mapViewParams);
                        // delete  all properties with value undefined from object 
                        value = deleteUndefinedProperty(value);
                        // if value undefined, skip this and take next from indexDeclaration Array 
                        if (typeof value === 'undefined') {
                            console.warn(idxName, " - Result of Function 'mapView' can't be 'undefined'. If Function 'mapView' is undeclared, set variable 'defaultMapView' with a static string value.");
                            continue;
                        }
                        //console.log(value," value as return of mapView in ",idxName," ------------# ------------# ------------# ------------# ");

                        
                        // console.log("HANDLE KEY:",snapshot.key()+indexCounterKeyHeader(i)," - IDX-NAME ",idxName, "PRIORITY:", priority, " VALUE:",value, "------------------");                        

                        // Firebase 'child_removed' event triggered set value = null, this removes node from referenceIndex in Firebase 
                        if (remove === true) value = null;
                        // add, update or child_remove an index-node with index(priority) and view(value)                        
                        referenceIndex.child(idxName).child(snapshot.key() + indexCounterKeyHeader(i)).setWithPriority(value, priority);
                        
                    };

                    console.timeEnd("set Index"); 

                }

                // QUERY --------------------------------------------------------------------------------------

                /*  
                 *  @param index 
                 *  could be any Index Item from indexDeclaration Array 
                 *  ie. 'indexDeclaration[0]'  or Index-Object { indexName: 'myIndexName', ... } or matching indexName as string from Index-Object
                 *
                 */
                function checkIndex(index) {
                    // index could be Index Object or the indexName as string from Index Object
                    return (typeof index === 'object') ? index.indexName : index;
                }

                function queryDocument(ref, dataSnapshot, sort, queryResultArray) {

                    dataSnapshot.forEach(function (i) {
                        ref.child(i.key().slice(0, -indexCounterLen)).once('value', function (i) {

                            if (!queryUniqe[i.key()]) {
                                sort ? queryResultArray.push({
                                    key: i.key(),
                                    value: i.val()
                                }) : queryResultArray.unshift({
                                    key: i.key(),
                                    value: i.val()
                                });
                                queryUniqe[i.key()] = true;
                            }

                        });
                    });

                    return queryResultArray;
                }

                function queryView(dataSnapshot, sort, queryResultArray) {

                    var k;

                    dataSnapshot.forEach(function (i) {
                        k = i.key().slice(0, -indexCounterLen);
                        if (!queryUniqe[k]) {
                            sort ? queryResultArray.push({
                                key: k,
                                value: i.val()
                            }) : queryResultArray.unshift({
                                key: k,
                                value: i.val()
                            });
                            queryUniqe[i.key().substr(indexCounterLen)] = true;
                        }

                    });

                    return queryResultArray;
                }

                function queryDo(refData, refQuery, sort, view, queryResultArray) {

                    console.time("Query");

                    queryUniqe = queryResultArray ? queryUniqe : {};

                    queryResultArray = queryResultArray || [];

                    sort = (sort === false) ? false : true;

                    view = (view === false) ? false : true;


                    return new Promise(function (resolve, reject) {
                        refQuery.once('value', function (dataSnapshot) {

                            view ? resolve(queryView(dataSnapshot, sort, queryResultArray)) : resolve(queryDocument(refData, dataSnapshot, sort, queryResultArray));

                            console.timeEnd("Query");

                        }, function (errorObject) {
                            reject(errorObject);
                        });

                    });
                }

                // --- 'self' is the 'FirebaseIndexView' service object------------------------------------------                     

                var self = {};

                // Methods to manage Index --------------------------------------------------------------------     

                // if no 'mapView' is declared, then the value of 'defaultMapView' will be used.  
                self.__defineGetter__("defaultMapView", function () {
                    return defaultMapView;
                });
                self.__defineSetter__("defaultMapView", function (s) {
                    defaultMapView = s;
                });

                // flag holding status of indexing 
                self.isIndexing = function () {
                    return indexing
                };
                
                // Start / Stop automatic indexing
                self.indexOn = function (rebuild) {

                    if (indexing === true || !referenceIndex || !reference) return;

                    if (rebuild === true) {
                        // set on for rebuilding all data
                        refChildBuild = reference.on('child_added', function (snapshot) {
                            indexHandle(referenceIndex, indexDeclaration, snapshot);
                        });
                    } else {
                        // set on for data from lastdata beginning
                        refChildAdded = reference.limitToLast(1).on('child_added', function (snapshot) {
                            indexHandle(referenceIndex, indexDeclaration, snapshot);
                        });
                    }

                    refChildChanged = reference.on('child_changed', function (snapshot) {
                        eventHandler.publish('child_changed', snapshot);
                        indexHandle(referenceIndex, indexDeclaration, snapshot);
                    });

                    refChildMoved = reference.on('child_moved', function (snapshot) {
                        indexHandle(referenceIndex, indexDeclaration, snapshot);
                    });

                    refChildRemoved = reference.on('child_removed', function (snapshot) {
                        eventHandler.publish('child_removed', snapshot);
                        indexHandle(referenceIndex, indexDeclaration, snapshot, true);
                    });

                    indexing = true;

                }
                self.indexOff = function () {

                    if (indexing === false || !referenceIndex || !reference) return;

                    //reference.off();    // cancel all events from your reference

                    // cancel events from your reference    
                    reference.off('child_added', refChildBuild);
                    reference.off('child_added', refChildAdded);
                    reference.off('child_changed', refChildChanged);
                    reference.off('child_moved', refChildMoved);
                    reference.off('child_removed', refChildRemoved);

                    indexing = false;

                };
              
                // Delete / Rebuild Index
                self.indexDelete = function () {

                    if (!referenceIndex || !reference) return;

                    self.indexOff();

                    referenceIndex.set(null, function (error) { // delete INDEX
                        if (error) {
                            console.warn('Deleting Index failed with Error:', error);
                        } else {
                            // console.log('Index deleting succeeded');                           
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
                *   could be any index item from indexDeclaration array ie. 'indexDeclaration(0)'  or a string matching indexName in any index item               
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
                *   @param view:
                *   boolean TRUE delivers a queryResultArray filled with index views (JSON)
                *   [ ... { key:'...', value: JSON-VIEW Object } ... ]
                *   boolean FALSE delivers a queryResultArray filled with the origin documents (JSON)
                *   [ ... { key:'...', value: JSON-document } ... ]
                *
                *   @param [queryResultArray]
                *   queryResultArray is optional. If undefined generate new queryResult,
                *   otherwise extend the existing queryResultArray with the new result.
                *   
                *   @example query chaining with promise:
                    FirebaseIdx.queryFromTo(index1, termFrom1, termTo1, sortup, view)        
                    .then( function(result1)
                    {            
                        return FirebaseIdx.queryFromTo(index2, termFrom2, termTo2, sortup, view, result1)  // here pass in result1   
                    })        
                    .then( function(result2){
                        // ... use result2 ...
                    });
                *
                */
                self.queryFromTo = function (index, startAt, endAt, sort, view, queryResultArray) {

                    index = checkIndex(index);
                    
                    // if endAt undefined then find all startAt
                    endAt = endAt ? endAt : startAt;
                     
                    var queryRef = referenceIndex.child(index).startAt(startAt).endAt(endAt);

                    return queryDo(reference, queryRef, sort, view, queryResultArray); // // return Promise

                };

                self.queryStartAt = function (index, startAt, limit, sort, view, queryResultArray) {

                    index = checkIndex(index);
                    limit = limit ? limit : 1;
                    var queryRef = referenceIndex.child(index).startAt(startAt).limitToFirst(limit);

                    return queryDo(reference, queryRef, sort, view, queryResultArray); // // return Promise

                };

                self.queryEndAt = function (index, endAt, limit, sort, view, queryResultArray) {

                    index = checkIndex(index);
                    limit = limit ? limit : 1;
                    var queryRef = referenceIndex.child(index).endAt(endAt).limitToLast(limit);
                    
                    return queryDo(reference, queryRef, sort, view, queryResultArray); // return Promise

                };

                self.queryFirst = function (index, startAt, view, queryResultArray) {
                    return self.queryStartAt(index, startAt, 1, true, view, queryResultArray); // return Promise
                };

                self.queryLast = function (index, endAt, view, queryResultArray) {
                    return self.queryEndAt(index, endAt, 1, true, view, queryResultArray); // return Promise
                };

                // Methods to manage Joins             
                 
                // EventHandler subscribe .on 'child_changed' and 'child_removed' events
                eventHandler.subscribe('child_changed', function (snapshot) {
                    if (typeof updater==='function' ) updater(snapshot);
                });
                eventHandler.subscribe('child_removed', function (snapshot) {                    
                    if (typeof updater==='function' ) updater(snapshot, true);
                });
                
                /*
                    if you have a reference in your 'Person' Index to 'Company'-Data, then changing 'Company'-Data must synchronise the view in 'Person' Index 
                    'indexSync' will keep your views containing 'Company' Data upToDate and changes will be reflected in the View of 'Person' Index

                    @param
                    reference: Firebasereference to your Index which should be updated
                    [index]:   a string or object, which holds the name of the index
                    -
                    FirebaseIndexCompany.update(referenceIndexView_Person.child('_joinPerson'));
                    or 
                    FirebaseIndexCompany.update(referenceIndexView_Person, '_joinPerson');
               */
                self.indexSync = function (referenceIndexToWatch, index) {
             
                    index=checkIndex(index);
                    var ref=index ? referenceIndexToWatch.child(index) : referenceIndexToWatch;
                    
                    updater = function (snapshot, remove) {
                    
                        if (snapshot.exists()===false) return;
                        
                        var doc = snapshot.val(),
                            key = snapshot.key();
                            
                        // console.log(ref.child(index).toString(), " REF - KEY:",key," DOC:",doc);
                        ref.startAt(key).endAt(key).once('value', function (dataSnapshot) {
                                dataSnapshot.forEach(function (snap) {
                                    if (remove) doc=null;
                                    snap.ref().setWithPriority(doc, snap.getPriority());
                                });
                        });

                    };
                    
                };
               
                self.getLinkedIndex = function (doc, linker) {
                    
                    var snapvalue,
                        linker= linker ? doc[linker] : doc._linked;
                    
                    return linker || undefined;
                };

                /*
                // get new created key
                var companyKey= referenceCompany.push(company).key(); 
                
                // set property '_linked' in person JSON-Object with key from company  
                person._linked=companyKey;                
                referencePerson.push(person);
                                
                */
                self.getLinkedDocument = function (doc, linker) {
                    
                    var snapvalue,
                        linker= linker ? doc[linker] : doc._linked;
                    
                        //console.log( "-Linked to " , linker," REF:--",reference.child(linker).toString(), "doc --",doc);
                    
                        reference.child(linker).once('value', function (snapshot) {
                            if (snapshot.exists()===true) snapvalue= snapshot.val();
                        });
                    return snapvalue || null;
                };
 
                return self;

            };

     }]);

}());