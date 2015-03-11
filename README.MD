##Firebase - IndexView 


### Why **Firebase IndexView**?

Working with [Firebase](https://www.firebase.com/) or other databases sorting and searching records is our main topic, but if you want to store documents in JSON notation in Firebase, sometimes it is not easy to search for values in nested documents. I know there are a lot of discussions about 'flattening structures' out there, but if you have an index, it is easy and fast to pull out a document from Firebase in JSON notation.

Despite [structuring](https://www.firebase.com/docs/web/guide/structuring-data.html) and [denormalizing](https://www.firebase.com/blog/2013-04-12-denormalizing-is-normal.html) your data is the recommended way. Sometimes you need to make a deeper look-up in a stored document(JSON) in Firebase, because you have - coming up with some given data - to keep this structure. Flattening structure means also to maintain your 'denormalized' data at multiple positions in your database synchronized. If you don't want to integrate an external solution like ElasticSearch and you don't want to work with a mixed server- & client-side solution, then **IndexView** brings up an - easy to go - AngularJS solution. **IndexView** is a pure client-side solution and extends only the backend capabilities of Firebase. 

Firebase **IndexView** will help you to index any documents (JSON notation) stored in Firebase and will search for each indexed - even nested - property. Define index- and view-mapping functions and **IndexView** will automatically hold your index and view uptodate. See here data in `dinomeal` node, each data-document with an unique key. 

![Data Structure](https://fireindex.firebaseapp.com/img/structure_data.png)

In difference to [Firebase's data index](https://www.firebase.com/docs/security/guide/indexing-data.html) **IndexView** can index and sort also a nested 'child of a child of a child...' . **IndexView** uses a mapIndex function to transform your index-keys e.g. to lowercase: if you have mixed upper- and lowercase entrys from a foreign readonly database, then - on the fly - all indexes could be transformed to lowercase. You know Firebase queries are case sensitiv. Or you can transform a date into a value that represents the number of milliseconds for doing some calculations. Any mapping function is allowed, if the result is a valid index-key ( stored as [Firebase priority().](https://www.firebase.com/docs/web/api/firebase/setpriority.html)).

Further IndexView provides - beside **mapped indexes** - the option to generate **mapped views** of your origin Firebase data-documents, which are stored as values. A view can return a simple 'true' but also extract a summary or a calculation over values in your data-document. Next you see the index node `IDX-dinomeal` where you can find your indexes created from origin data in `dinomeal`. The priority is your index sorted and queryable. The value is your concatenated view.  

![Data Structure](https://fireindex.firebaseapp.com/img/structure_index.png)

IndexView - if activated - generates automatically indexes and views of your referenced Firebase DB. It watches your data and **updates your index and views dynamically**, as data is added,changing or removed. But edit and manipulate data only in your data-reference `dinomeal` and **never** in your index-reference `IDX-dinomeal`. Data in index-reference will be maintained by IndexView.


![Data Structure](https://fireindex.firebaseapp.com/img/structure_index_changed.png)


> IMPORTANT NOTE: All data in index-reference MUST NOT BE EDITED! Never manually edit data located in your index-reference, your changes will be overwritten by the next index-update automatically. Edit and manipulate data only in your data-reference.


The created IndexView object exposes methods to manage indexing with a simple `IndexOn()` or `IndexOf()`. If necessary you can use method `IndexDelete()` or method `IndexRebuild()` to delete or rebuild your indexes and the corresponding views.  

> IMPORTANT NOTE: Is your Index damaged, corrupted or lost, then rebuild it with 'FirebaseIdx.indexRebuild()'. 
> Warning: If you have large data sets, this procedure is expensive because it re-indexes all available data. 

**IndexView** comes as an AngularJS modul which works perfectly pure clientside. It supports the Firebase backend service strategy and does not need serverside pre-requirements. 

**IndexView** recommends Vulcan, an Chrome application built by Firebase. Changing indexes can be visualized directly in Chrome's DevTools by using Vulcan. 

> TIP: Install in Chrome the Firebase Extension 'Vulcan', open Chrome Dev-Tools and observe Indexes and Views, when Data is changing.

This project is a simple and rapid prototyp to facilitate the opportunities of [Firebase](https://www.firebase.com/), IMHO a wonderful frontend-concept, thanks to all Firebase developer! 

Check out the **[Demo](https://fireindex.firebaseapp.com)** partly using Firebase's **[Dinosaurs](https://dinosaur-facts.firebaseio.com/)** database.

##Let's start


### Step 1) Get a Firebase Data-Reference 

To work with **IndexView** you must first create a new Firebase [reference](https://www.firebase.com/docs/web/guide/understanding-data.html) to your data store from a full Firebase URL.

	// DINOMEAL must be located at your own Account
	var reference= 
		new Firebase("https:/MyFirebaseAccount.firebaseio.com/dinomeal");   

-
	
	// Firebase's readonly DINOSAUR DB
	var reference= 
		new Firebase("https://dinosaur-facts.firebaseio.com/dinosaurs");

-----

### Step 2) Get a Firebase Index Reference 

Next create an index-reference where you want to store your index. This reference **must not be a child** of your data-reference. 

	// IDX-DINOMEAL must be located at your own Account
	var referenceIndex = 
		new Firebase("https://MyFirebaseAccount.firebaseio.com/IDX-dinomeal");     

But it's possible to reference your data `dinosaurs` and index `IDX-dinosaurs` to different Firebase accounts.

	// IDX-DINOSAUR must be writeable and located at your own Account
	var referenceIndex = 	
		new Firebase("https://MyFirebaseAccount.firebaseio.com/IDX-dinosaurs");       

----

### Step 3) Define your IndexDeclaration Array


This is the main point to control your indexes. **IndexDeclaration** is an array of index-objects, which declares the mapping functions returning an index and a view. 

This is an example of one item in indexDeclaration array, which creates the Index 'theropoda' from order in 'Dinosaur' and storing a concatenated view like: 'linhenykus belongs to theropoda'

    var IndexDeclaration =
	[...
	    
		{   
			indexName: 'dino_order',                        
	        
			mapIndex: function(doc){ 
				return doc.order ? doc.order.toLowerCase() : null },
	        
			mapView:  function(doc){ 
				return (doc.order && doc._key) ?  doc._key + ' belongs to ' + doc.order : null }
	    },                       
    
	...]

Every index-item in IndexDeclaration array is an object with 3 properties: 

1. First property **indexName** becomes an child of your [Firebase Index Reference](https://www.firebase.com/docs/web/guide/understanding-data.html#section-creating-references) and locates the position of your index in Firebase. **indexName** must be a string - in best case it could be one property of your document like 'doc.order'. The value of **indexName** could be nested like 'meals/vegetarian'. In this case the index will be located at the path 'dinomela/[uniquekey]/meals/vegetarian'. This allows building an individual index tree in Firebase.

	{ indexName: 'order', ... } 

	// or 

	{ indexName: 'meals/vegetarian', ... } 


2. Control index generation with **mapIndex**, which expects a function or an array with a function as first item for mapping your data-document into an index-key (= Firebase priority). In this example the property `order` from your data-document becomes the lowerCase IndexKey. This key is sorted and can be searched. Setting the index-kex (= Firebase priority) to null removes any existing priority and will be ordered first. See [Firebase setPriority().](https://www.firebase.com/docs/web/api/firebase/setpriority.html) 
   
	{ 
		indexName: 'order', 
		
		mapIndex: function(doc){ 
			return doc.order ? doc.order.toLowerCase() : null }, 
	
	...} 
          
	// or define mapIndex function with 2 parameters 

	function makeIndex(doc, case){ 
		return doc.order ? (case ? doc.order.toUpperCase():doc.order.toLowerCase() ) : null };
	 
	{ 
		indexName: 'upperOrder', 

		// first item is the mapping function, 
		// further items(2-n) are parameters for mapping function
		mapIndex: [makeIndex, true],   
	
	...} 
         

3. The third index property **mapView** expects - like mapIndex - a function or an array with a function as first item for mapping the document into a view, wich is stored as value. The value to be written to your Firebase (can be an object, array, string, number, boolean, or null). If mapView function returns `null` or `undefined` the entry will be removed from Firebase. The key of the current document is available by property `_key`
 		
	function makeIndex(doc, case){ 
		return doc.order ? (case ? doc.order.toUpperCase():doc.order.toLowerCase() ) : null }

	[...
		{ 
			indexName: 'upperOrder', 
		
			// first item function, items(2-n) are parameters for mapping function
			mapIndex: [makeIndex, true], 
	
			// set value as key of document, which is available by property 'doc._key'
			mapView:  function(doc){ 
				return (doc._key) ?  doc._key : null }

		} 
	...]


> IMPORTANT NOTE: IF your first mapView parameter `doc` becomes - in case of being removed from Firebase - `undefined `, then mapView must take precautions to return a `null` or `undefined` value. Only in this case is guaranteed that the Index entry also will be removed.

	FirebaseIndexView.defaultMapView=true;

	[..
		{ 				
			...
			mapView: undefined,  // set view to 'true'
			...
		}
	...]

> IMPORTANT NOTE: Is mapView `undefined` or the mapView property not declared, then the value of variable `defaultMapView` will be the value of your index. `defaultMapView` is set to `true` by default and can hold to any valid Firebase value like a string, object or number. 

		FirebaseIndexView.defaultMapView=true;  // set defaultMapView here with a valid Firebase value 


----

## Examples for Indexes and Views

#####a) Simple Index 	

	var IndexDeclaration =
	[...
	    
		{   
			indexName: 'dino_order',                        
	        
			mapIndex: function(doc){ return doc.order || null },
	        
			mapView:  function(doc){ return doc.order ? true : null }
	    },                       
    
	...]


#####b) Minimalistic Index 

Is **mapIndex** `undefined` or the property **mapIndex** undeclared, then IndexView tries 
to create the index `doc[indexName]`. If property 'order' in your 
data-document exists, then an index with the value from `document.order` will generated. 

Is **mapView** `undefined` or the **mapView** property not declared, then the value of variable `defaultMapView` will be the value of your index. `defaultMapView` is set to `true` by default and can hold to any valid Firebase value like a string, object or number. 

If the value of **mapView** is a string then IndexView tries to interpret this string as property of your data-document like 'doc[string]', e.g. `mapview:'order'` generates a view with value of 'doc.order'

Is 'mapView' an array then IndexView interprets the first item as function and all other items (2-n) in the array as parameters. The first parameter will always be the document your are working on. 
> mapView:[Function(doc, Param1, Param2){...}, Param1, Param2, ...]	

	var IndexDeclaration = 
	[...
		{
			// no mapIndex and no mapView declared, but indexName must match a property of document            
	    	indexName: 'order'                  
		},
	...]

and this will created this index 

![Data Structure](https://fireindex.firebaseapp.com/img/structure_dino_order.png)


#####c) Conditional Index

Conditional Index declaration for 'Dinosaur' database, creates an index only if condition **doc.order==='ornithischia'** is true:

	[ ...
		{   
            indexName: 'dino_only_flying',

            mapIndex: function(doc) { return doc._key; },

            mapView: function(doc) { 
				return (doc.order==='ornithischia') ? true : undefined} 
				// only ornithischia is flying  else generate with 'undefined' no view and no index
        },
	... ];

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
            indexName: 'meals/day',

            mapIndex: function(doc) {return doc.mealsPerDay || null },

            mapView: function(doc) { // doc = dinomeal object
				
				var dino=FirebaseIndexView_Dino.getLinkedDocument(doc); // dino = dinosaur object

				return doc.mealsPerDay + " meals per day with "+doc.calory + 
					" calories/meal make a dino weight of " + (dino ? dino .weight : null);
			}
		},
	... ];

This index produces this Firebase structure:

![Data Structure](https://fireindex.firebaseapp.com/img/index_meals_day.png)


#####e) Combine different 'Meals' into one Index

Firebase structure of **'dinomeal'** Data DB from which you construct the index. Take a look at the branch **'meals'** with items 'drink,'meat' and 'vegetarian'.

![Data Structure](https://fireindex.firebaseapp.com/img/index_meals_data.png)

Now make a declaration for a **'dinomeal' Index** joining all meals in one index:

	// helper functions
	function mapIndexMeal(doc, kind) { 
		if (doc.meals){ return doc.meals[kind] ? doc.meals[kind].toLowerCase() : null } 
	};
	
	function mapViewMeal(doc, kind, action) { 
			return doc.meals ? 
			( doc.meals[kind] ? ( (doc._linked + " " + action + " " + doc.meals[kind]) || 'no '+ kind) : null )
			: null 
	}
   
	var indexdeclaration=
	[ 
		{   
            indexName: 'meals',   // use 3x the same indexName
            
			mapIndex: [mapIndexMeal,'drink'],
			
            mapView: [mapViewMeal,'drink','take liquid only']
        },
        {   
            indexName: 'meals',   // use 3x the same indexName
            
			mapIndex: [mapIndexMeal,'meat'],
            
			mapView: [mapViewMeal,'meat', 'eats like a raptor']
        },
        {   
            indexName: 'meals',   // use 3x the same indexName
            
			mapIndex: [mapIndexMeal,'vegetarian'],
            
			mapView: [mapViewMeal,'vegetarian','champs loud the']
        }        
	];

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

and every change (add, update, remove) in your Firebase reference will automatically update your index in `IDX-dinomeal`. Watch out this things in **Vulcan** 

  
---
### Step 7) Try searching:


All query methods are related to Firebase but return a promise. 

> FirebaseIndexView.queryFromTo(index, from, [to], [sort], [showView], [queryResultArray] )
> 
> .then( function(result){ ... } )

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
            
            indexName: 'dino_living_timespan',
            
            mapIndex: function (doc) {
                return (doc.appeared && doc.vanished) ? (doc.vanished - doc.appeared) : null;
            },
            
            mapView: function (doc) {
                return (doc.appeared && doc.vanished) ? doc._key + ' lives ' + 
				(doc.vanished - doc.appeared) + ' years.' : "no timespan";
            }
        },
    ];

    // locate reference to Dinosaur Facts Database 
    var reference = new Firebase("https://dinosaur-facts.firebaseio.com/dinosaurs");

    // locate reference to index ( dinosaur-facts.firebaseio.coms doesn't work here because it is readonly)
    var referenceIndexView = new Firebase("https://[MY FIREBASE ACCOUNT].firebaseio.com/IDX-dinosaur");

    //  Create an IndexView Object for working on  
    var FirebaseIdx = new FirebaseIndexView(reference, indexDeclaration, referenceIndexView); 

    // If you start with a empty database use  .indexOn()
    // FirebaseIdx.indexOn();
    
	// If you - like here - start with an existing database use .indexRebuild()
    FirebaseIdx.indexRebuild();
	
    FirebaseIdx.queryFromTo('dino_living_timespan', 1500000, 6000000, true, true)
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

> 
> IMPORTANT NOTE: This project uses - to keep it simple - native promises in ECMAScript 6 current only available in Chrome or Firefox. For using other Browsers you have to polyfill or install a promise library ([AngularJS $q](https://docs.angularjs.org/api/ng/service/$q) or  [kriskowal](https://github.com/kriskowal/q)) instead. 
> 
     
