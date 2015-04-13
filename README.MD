##Firebase - IndexView 


### Why **Firebase IndexView**?

If you are building pure clientside applications [Firebase](https://www.firebase.com/) is the perfect backend to store data and host an application. IF you are working with Firebase like other Databases sorting and searching records is a main topic. IndexView brings you easy search capabilities, by automatically indexing your data in the background. There is no need do change your work. Especially if you have nested documents in JSON Notation it is easy to search for values in the properties of a nested document. e.g. search for all drinks, meats and vegetarians.

I know there are a lot of discussions about 'flattening structures' out there, but if you have an fitting index, it is easy and fast to pull out `dinomeals` containing `Beer `.

	dinomeals: { 
	
		key1: { 
			meals: { 
				drink: "Cola, Budweiser, Fanta" , 
				meat: "Beef, Duck",
				vegetarian: "straw"  
			}		
		},
		
		key2: { 
			meals: { 
				drink: "Water, Beer", 
				vegetarian: "Fruits, Apples"  
			}		
		},
		...
	}
	

Despite [structuring](https://www.firebase.com/docs/web/guide/structuring-data.html) and [denormalizing](https://www.firebase.com/blog/2013-04-12-denormalizing-is-normal.html) your data is the recommended way. Sometimes you need to make a deeper look-up in a stored document(JSON) in Firebase, because you have - coming up with some given data - to keep this structure. Flattening structure means also to maintain your 'denormalized' data at multiple positions in your database synchronized. If you don't want to integrate an external solution like ElasticSearch and you don't want to work with a mixed server- & client-side solution, then **IndexView** brings up an - easy to go - AngularJS solution. **IndexView** is a pure client-side solution and extends only the backend capabilities of Firebase. Alternativ you can also use a Node.js to build an index-server to keep your index in Firebase uptodate.

**IndexView** will help you to index any documents (JSON notation) stored in Firebase and will search for each indexed - even nested - property. It is easy to go, define index-names and some view-mapping functions and **IndexView** will automatically hold your indexes and views uptodate. See here sample data in `dinomeal` node, each data-document with an unique key. 

![Data Structure](https://fireindex.firebaseapp.com/img/structure_data.png)

In difference to [Firebase's data index](https://www.firebase.com/docs/security/guide/indexing-data.html) **IndexView** can index and sort also a nested 'child of a child of a child...' . In this case you create an index of all items in each property of meals e.g. `Cola, Budweiser, Fanta, Beef, Duck, straw`.  **IndexView** uses a mapView function to transform your data into indexes e.g. to lowercase: if you have mixed upper- and lowercase entrys from a foreign readonly database, then - on the fly - all indexes could be transformed to lowercase. You know Firebase queries are case sensitiv. Or you can transform a date into a value that represents the number of milliseconds for doing some calculations. Any index mapping function is allowed, if the result is a valid index ( stored as [Firebase priority().](https://www.firebase.com/docs/web/api/firebase/setpriority.html)).

Further IndexView provides the option to generate **mapped views** of your origin Firebase data-documents, which are stored as values. A view can return a simple `true` but also extract a summary or make a calculation over values in your data-document. Next you see the index node `IDX-dinomeal` where you can find your indexes created from origin data in `dinomeal`. The priority is your index sorted and queryable. The value here is a concatenated view but could also be a simple `true`.  

![Data Structure](https://fireindex.firebaseapp.com/img/structure_index.png)

**IndexView** is easy to use - if once activated - it maintain automatically indexes and views of your referenced Firebase DB. It watches your data and **updates your index and views dynamically**, as data is added,changing or removed. But edit and manipulate data only in your data-reference `dinomeal` and **never** in your index-reference `IDX-dinomeal`. Data in index-reference will be maintained by IndexView.

![Data Structure](https://fireindex.firebaseapp.com/img/structure_index_changed.png)


> IMPORTANT NOTE: All data in index-reference MUST NOT BE EDITED! Never manually edit data located in your index-reference, your changes will be overwritten by the next index-update automatically. Edit and manipulate data only in your data-reference.

###The IndexView Object

The **IndexView Object** exposes methods to manage indexing with a simple `IndexOn()` or `IndexOf()`. If necessary you can use method `IndexDelete()` or method `IndexRebuild()` to delete or rebuild your indexes and the corresponding views.  

> IMPORTANT NOTE: Is your Index damaged, corrupted or lost, then rebuild the index with `.indexRebuild()`. 
> Warning: If you have large data sets, this procedure is expensive because it re-indexes all available data. 

###NodeJS Modul

**IndexView** comes as an NodeJS modul. Modify `nodeFirebase.js` with your references to your Firebase data and define all Indexes and Views  you want to generate in the IndexDeclaration array. Start your indexserver `node nodeFirebase.js` and everthing is done. 

###AngularJS Service

**IndexView** comes as an AngularJS modul which works perfectly pure clientside. It supports the Firebase backend service strategy and does not need serverside pre-requirements. 

For better understanding **IndexView** recommends Vulcan, an Chrome application built by Firebase. Changing indexes can be visualized directly in Chrome's DevTools by using Vulcan. 

> TIP: Install in Chrome the Firebase Extension 'Vulcan', open Chrome Dev-Tools and see Indexes and Views changing, when Data is updated.

This project is a simple and rapid prototyp to facilitate the opportunities of [Firebase](https://www.firebase.com/), IMHO a wonderful frontend-concept, thanks to all Firebase developer! 

Check out the **[Demo](https://fireindex.firebaseapp.com)** partly using Firebase's **[Dinosaurs](https://dinosaur-facts.firebaseio.com/)** database to join it with Database Dinomeals.

Explore this project at **[https://github.com/wotamann/Firebase-IndexView](https://github.com/wotamann/Firebase-IndexView)**



##Let's start


### Step 1) Get a Firebase Data-Reference 

To work with **IndexView** you must first create a new Firebase [reference](https://www.firebase.com/docs/web/guide/understanding-data.html) to your data from a full Firebase URL.

	// DINOMEAL must be located at your own Account
	var referenceDinomeal= 
		new Firebase("https:/MyFirebaseAccount.firebaseio.com/dinomeal");   

-
	
	// Firebase's readonly DINOSAUR DB
	var referenceDinosaurs= 
		new Firebase("https://dinosaur-facts.firebaseio.com/dinosaurs");

-----

### Step 2) Get a Firebase Index Reference 

Next create an index-reference where you want to store your index. This reference **must not be a child** of your data-reference. 

	// IDX-DINOMEAL must be located at your own Account
	var referenceIndexDinomeal = 
		new Firebase("https://MyFirebaseAccount.firebaseio.com/IDX-dinomeal");     

But it's possible to reference your data `dinosaurs` and index `IDX-dinosaurs` to different Firebase accounts.

	// IDX-DINOSAUR must be writeable and must be located at your own Account
	var referenceIndexDinosaurs = 	
		new Firebase("https://MyFirebaseAccount.firebaseio.com/IDX-dinosaurs");       

----

### Step 3) Define your IndexDeclaration Array


This is the main point to control your indexes. **IndexDeclaration** is an array of index-objects, which declares the mapping functions returning an index and a view. 

This is an example of one item in indexDeclaration array, which creates the Index 'theropoda' from order in 'Dinosaur' and storing a concatenated view like: 'linhenykus belongs to theropoda'

    var IndexDeclarationDinosaurs =
	[
		{   
            viewName: 'order',
                        
            mapView: function(emit, doc){ 
                
				var idx= doc.order ? doc.order.toLowerCase() : null,
                    value= (doc.order && doc._key) ?  doc._key + ' belongs to ' + doc.order : null 

            	emit(idx,value)  // generates index/view
            },
        }                          
    	...

	]

Every index-definition in IndexDeclaration array is an object with 2 properties: 

1. First property **viewName** becomes an child of your [Firebase Index Reference](https://www.firebase.com/docs/web/guide/understanding-data.html#section-creating-references) and locates the position of your index in Firebase. **viewName** must be a string - in best case it could be one property of your document like 'doc.order'. The value of **viewName** could be nested like 'meals/drink'. In this case the index will be located at the path 'IDX-dinomeal/[uniquekey]/meals/drink'. This allows building an individual index tree in Firebase.

		{ viewName: 'order', ... } 
		
		// or 
		
		{ viewName: 'meals/food', ... } 


2. Control index generation with **mapView**, which expects a function or an array with a function as first item for mapping your data-document into an index-key (= Firebase priority). In this example the property `order` from your data-document becomes the lowerCase IndexKey. This key is sorted and can be searched. Setting the index-kex (= Firebase priority) to `null` removes any existing priority and will be ordered first. See [Firebase setPriority().](https://www.firebase.com/docs/web/api/firebase/setpriority.html). Setting the index-kex (= Firebase priority) to `undefined` removes this record. 
	
	**mapView** expects a function or an array with a function as first item for mapping the document into a view, wich is stored as value. The value to be written to your Firebase (can be an object, array, string, number, boolean, or null). If mapView function emits a value  `null` or `undefined` the entry will be removed from Firebase. If you get an query result the key of the current document is available by property `_key`. The index of the current document is available by property `_priority`. The function `emit` takes 2 parameters `emit(index, value)`. If you call emit it generates an record in index-database with priority `index` and value `value`.
		
		function makeOrder(emit, doc, param1){ 	                
			var idx= doc.order ? doc.order.toLowerCase() : null,
	            value= (doc.order && doc._key) ?  doc._key + ' belongs to ' + doc.order : null 
	    	emit(idx,value)  // generates index/view
		}
	
		var IndexDeclarationDinosaurs =
		[
		// pass function to mapView
			{   
	            viewName: 'order',
	            mapView: makeOrder
			},
		
		/* or alternativ pass some parameters to your function
			{   
	            viewName: 'order1',
	            mapView: [makeOrder,"param1"]
			}        
		*/	
		]

----

## Examples for Indexes and Views

#####a) Simple Index 	

`mapView` can be a function with 2 parameters `emit, doc`. 'emit' is a function, which does the work and generates an index. emit must be called with `index` and `value` to generate an index.

> mapView:function (emit, doc) { ... emit(index,value) ... }	

	var IndexDeclarationDinosaurs =
	[	    
		{   
            viewName: 'order',
                        
            mapView: function(emit, doc){ 
                
				var idx= doc.order ? doc.order : null;
            	emit(idx,true)  // generates index / view
            },
        }                            
	]


Is `mapView` an array then IndexView interprets the first item as function and all other items (2-n) in the array as parameters. The first parameter will always be the emit function, the second parameter is the document your are working on. 

> mapView:[function(emit, doc, param1, param2) {...}, param1, param2, ...]	

		function makeOrder(emit, doc, param1){ 	                
			var idx= doc.order ? doc.order.toLowerCase() : null,
	            value= (doc.order && doc._key) ?  doc._key + ' belongs to ' + doc.order : null 
	    	emit(idx,value)  // generates index/view
		}
	
		var IndexDeclarationDinosaurs =
		[
			{   
	            viewName: 'order1',
	            mapView: [makeOrder,"param1"]
			}        
		]

If `mapView` is undefined, then IndexView try `mapView=function(emit,doc) { emit(doc[viewName],true)}`

	var IndexDeclarationDinosaurs = 
	[
		{
			// no mapView declared, but viewName matches a property of document            
	    	viewName: 'order'                  
		},
	]

and this will create following index 

![Data Structure](https://fireindex.firebaseapp.com/img/structure_dino_order.png)


#####c) Conditional Index

Conditional Index declaration for 'Dinosaur' database, creates an index only if condition **doc.order==='ornithischia'** is true:

	[ 
		{
            viewName: 'dino_only_Flying',
            mapView: function (emit, doc) {
                if ((doc.order === 'ornithischia') === true) {
                    emit(doc._key, true);
                }
            }
        },
	];

Firebase structure:

![Data Structure](https://fireindex.firebaseapp.com/img/index_partial.png)

#####d) Mixed Index from `Dinomeal` and `Dinosaur`

This Index declaration uses `Dinosaur` and `Dinomeal` database. You can in object `FirebaseIndexView` access an linked object of `FirebaseIndexView_Dino` with `FirebaseIndexView_Dino.getLinkedDocument(doc, linker)`. Default linking property `_linked` if parameter 
`linker` keeps undefined.

In `Dinomeal ` the stored objects must have a property `_linked` containing keys from `Dinosaur`. Get this linked object from `Dinosaur` with `getLinkedDocument(doc,[linker])` 

![Data Structure](https://fireindex.firebaseapp.com/img/index_meals_data.png)


	[ ...
		{   
            // 'meals/day'  let's indivual configurate your index tree if necessary            
            viewName: 'meals/day',

            mapView: function(emit, doc) { // doc = dinomeal object
				
				var key=doc.mealsPerDay || null,
				    
					dino=FirebaseIndexView_Dino.getLinkedDocument(doc), // dino = dinosaur object
					value=doc.mealsPerDay + " meals make a dino weight of " + (dino ? dino.weight : null);

				emit(key, value);
			}
		},
	... ];

This index produces the following Firebase structure:

![Data Structure](https://fireindex.firebaseapp.com/img/index_meals_day.png)


#####e) Combine different 'Meals' into one Index

Firebase structure of **'dinomeal'** Data DB from which you construct the index. Take a look at the branch **'meals'** with items 'drink,'meat' and 'vegetarian'.

![Data Structure](https://fireindex.firebaseapp.com/img/index_meals_data.png)

Now make a declaration for a **'dinomeal' Index** joining all meals in one index:

	// mapping and emiting function
    function makeMeals(emit, doc) {
        
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
                    emit(key, meal);

                }
            );
        }
    }  
       
    var indexDeclarationDinomeals = [
        
        {
            viewName: 'meals',
            mapView: makeMeals
        }
	]

Firebase structure of `IDX-dinomeal` Index DB. Take a look at the branch `meals`. Here you get a joined index containing all three kinds of meals. The view content here stays just for demonstration and could also be a simple `true`. It is now easy to search for all three kinds of meals with one query.

![Data Structure](https://fireindex.firebaseapp.com/img/index_meals.png)


---
### Step 4) Create `FirebaseIndexView`
	

First you have to create an object as instance of **FirebaseIndexView**.


> var FirebaseIndexView = [new] firebaseIndex(**reference**, **indexDeclaration**, [**referenceIndex]**)


	var FirebaseIndexView= 
			new firebaseIndex(reference, indexDeclarationArray, referenceIndex)
	
	//	or

	var FirebaseIndexView= 
			new firebaseIndex(reference, indexDeclarationArray); 
	
	/*  
		Omiting referenceIndex uses default index-reference path with heading 'IDX-'
		
		Data:                                               
		https://MyFirebaseAccount.firebaseio.com/dinomeal  
		
		creates this default Index:
		https://MyFirebaseAccount.firebaseio.com/IDX-dinomeal	
	*/


> FirebaseIndexView = [new] firebaseIndex(**reference**, **indexDeclaration**, [**referenceIndex]**)
> 
> **Parameters:**  
> 
> 
> 1) **reference** - Firebase reference to your data. See Step 1) 
>  
> 2) **indexDeclaration** - Array defining your indexes. See Step 3)
> 
> 3) [**referenceIndex**] - optional Firebase reference to control your index location. See Step 2)
>  


----
### Step 5) Use `FirebaseIndexView`

Methods of **FirebaseIndexView** for managing your Index 



	// start Indexing   	
	FirebaseIndexView.indexOn()          
	
	// stop Indexing   	
	FirebaseIndexView.indexOff()         
	
	// if your Index is corrupt then rebuild your Index, but if you have a large dataset this is an expensive job 
	FirebaseIndexView.indexRebuild()     
	
	// if you want delete the Index
	FirebaseIndexView.indexDelete()     

---
### Step 6) That's it! 

    FirebaseIndexView.indexOn() 

Now you can try to push a `meal` to your reference of `dinomeal`

	var meal = {

	    calory:30,

	    meals: 	{
					drink:'water',
					meat:'beef',
				},

		mealsPerDay:3
	  
	}

	reference.push(meal); 

and every change (add, update, remove) in your data-reference will automatically update your index in `IDX-dinomeal`. Watch out things happen in **Vulcan** 

  
---
### Step 7) Try searching:


All query methods are related to Firebase query methods but return a promise. 

> FirebaseIndexView.queryFromTo(search, [queryResultArray] )
> 
> .then( function(result){ use result } )

IMPORTANT NOTE: This project uses ECMAScript 6 native promises - IMHO - current only available in Chrome or Firefox. For using other browsers you have to polyfill or install a promise library ([AngularJS $q](https://docs.angularjs.org/api/ng/service/$q) or  [kriskowal](https://github.com/kriskowal/q))

#### Method 'queryFromTo'
 
Parameter 'queryResultArray' is optional. If undefined a new queryResult will be generated, otherwise the query extends the existing 'queryResult' with the new result.

	var sortUp = true;
	var showView = true;

	var termFrom="*";
	var termTo=termFrom +'\uFFFF';
	
	var index=indexDeclaration[0];  				// ->  { indexName: 'lastname', ... }  
	// or
	// var index=indexDeclaration[0].indexName;  	// -> 'lastname'  
	// or
	// var index='lastname'  
	 
	// queryFromTo() returns a Promise
	FirebaseIndexView.queryFromTo( index, termFrom, termTo, sortUp, showView )
		.then(function(result){   
      
			//showView true   ->  result = [ { key:key1, value:View1 }, ...  ]       
			
			//showView false  ->  result = [ { key:key1, value:Document1 }, ...  ]       
			
		})
     
#### Query with promise chaining:

IF you want to extend your first query, then you can pass the first searching result into the next query 

> First query:
> FirebaseIdx.queryFromTo(...) 
> 
> Second query:
> FirebaseIdx.queryFromTo(..., , result1) 



        FirebaseIdx.queryFromTo(index1, termFrom1, termTo1, sortup, view)        
        .then( function(result1)
        {            
			// here pass in result1 as last parameter   
            return FirebaseIdx.queryFromTo(index2, termFrom2, termTo2, sortup, view, result1)  

        })        
        .then( function(result2)
		{

            // ... use result2 ...

        });


	
#### Available query methods 

	// all query functions return a promise

	FirebaseIndexView.queryFromTo(index, startAt, endAt, sort, showView ).then(...);
	 
	FirebaseIndexView.queryStartAt(index, startAt, limit, sort, showView).then(...); 
	
	FirebaseIndexView.queryEndAt(index, endAt, limit, sort, showView).then(...); 
	 
	FirebaseIndexView.queryFirst(index, endAt, showView).then(...) ;
	 
	FirebaseIndexView.queryLast(index, endAt, showView).then(...);

-----
### Step 8)  Summary code


    // define Index and View in Indexdeclaration Array 
    var indexDeclaration = [
        {
			// no mapView declared, but viewName matches a property of document            
	    	viewName: 'order',
			
			mapView: function(emit, doc){ 
				var idx= doc.order ? doc.order : null;
				
				emit(idx,true)  // generates index with view 'true'
			},	
	
		}
    ];

    // locate reference to Dinosaur Facts Database 
    var reference = new Firebase("https://dinosaur-facts.firebaseio.com/dinosaurs");

    // locate reference to index ( dinosaur-facts.firebaseio.coms doesn't work here because it is readonly)
    var referenceIndexView = new Firebase("https://[MY FIREBASE ACCOUNT].firebaseio.com/IDX-dinosaur");

    //  Create an IndexView Object for working on  
    var FirebaseIdx = new FirebaseIndexView(reference, indexDeclaration, referenceIndexView); 

    // If you start with a empty database use  .indexOn()
    // FirebaseIdx.indexOn();
    
	// If you - like here - start with an existing database use once method: indexRebuild()
    FirebaseIdx.indexRebuild();
	

		/* 
		search={
            index:'meals',
            startAt:'A',
            endAt:'zz',
            sort:true,
            unique:true,
            output:'D',
            [reduceFn:function(previousValue, currentValue, index, array){ ...... }]
        }
		*/

    FirebaseIdx.queryFromTo(search)
        .then(function (result) {
            console.log(result);
    })



---

-

> TIP: Install Firebase extension 'Vulcan', open Chrome Dev-Tools and observe Firebase data, indexes and views.

-

> IMPORTANT NOTE: All data in index-reference MUST NOT BE EDITED!
> Never manually edit data located in your index-reference, your changes will be overwritten on next 
> automatically index-update. Edit and manipulate data only in your data-reference.

-

> IMPORTANT NOTE: Is your Index damaged, corrupted or lost, then rebuild it with 'FirebaseIdx.indexRebuild()'. 
> Warning: If you have large data sets, this procedure is expensive because it re-indexes all historical data. 

-


> IMPORTANT NOTE: This project uses - to keep it simple - native promises in ECMAScript 6 current only available in Chrome or Firefox. For using other Browsers you have to polyfill or install a promise library ([AngularJS $q](https://docs.angularjs.org/api/ng/service/$q) or  [kriskowal](https://github.com/kriskowal/q)) instead. 

Copyright (c) 2013-2014: wotamann

[https://github.com/wotamann](https://github.com/wotamann/Firebase-IndexView)


     
